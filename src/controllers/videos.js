import fs from "fs";
import path from "path";
import { uploadToS3 } from "../aws/s3.js";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import {
  insertVideo,
  patchVideoMeta,
  listVideos,
  getVideoById,
  updateVideoFields,
  deleteVideo,
  findVideoByOwnerAndName,
} from "../models/videos.js";
import { enrichByExternalAPI } from "../services/enrich.js";
import { getS3DownloadUrl } from "../aws/s3.js";

// Multer temp dir; we'll move to data/uploads after checks
const upload = multer({ dest: "data/tmp" });
export const uploadMw = upload.single("file");

// helper: probe duration
function probeDurationSec(filepath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filepath, (err, data) => {
      if (err) return resolve(null);
      const streams = data?.streams || [];
      const fmt = data?.format || {};
      const dur = Number(
        fmt.duration || streams.find((s) => s.duration)?.duration || 0
      );
      resolve(Number.isFinite(dur) && dur > 0 ? Math.round(dur) : null);
    });
  });
}

/**
 * Upload + Enrich:
 * - requires Cognito auth (req.user.sub)
 * - duplicate check by (owner, original_name)
 * - move tmp -> data/uploads
 * - insert DB row
 * - best-effort: set runtime_sec via ffprobe; enrich metadata
 */
export async function uploadAndEnrich(req, res) {
  if (!req.user?.sub) return res.status(401).json({ error: "unauthorized" });
  if (!req.file) return res.status(400).json({ error: "file required" });

  fs.mkdirSync("data/tmp", { recursive: true });

  // Duplicate check
  const duplicate = await findVideoByOwnerAndName(req.user.sub, req.file.originalname);
  if (duplicate) {
    fs.unlinkSync(req.file.path);
    return res.status(409).json({ error: "duplicate", video: duplicate });
  }

  // Insert row in DB first (so we get an ID)
  let video;
  try {
    video = await insertVideo({
      owner: req.user.sub,
      original_name: req.file.originalname,
      path: req.file.path,   // temporary, will update later
      size: req.file.size,
      status: "uploaded"
    });
  } catch (e) {
    fs.unlinkSync(req.file.path);
    console.error("DB insert failed:", e);
    return res.status(500).json({ error: "db insert failed" });
  }

  try {
    // ✅ Upload file to S3
    const fileBuffer = fs.readFileSync(req.file.path);
    const key = `videos/${video.id}-${req.file.originalname}`;
    await uploadToS3(fileBuffer, key, req.file.mimetype);

    // ✅ Update DB with S3 key
    await patchVideoMeta(video.id, { s3_key: key });

    // ✅ Remove local temp file
    fs.unlinkSync(req.file.path);

    video.s3_key = key;
  } catch (err) {
    console.error("S3 upload failed:", err);
    return res.status(500).json({ error: "failed to upload to S3" });
  }

  // Optional: enrichment (IMDb/OMDb/etc.)
  try {
    const meta = await enrichByExternalAPI(req.file.originalname);
    if (meta) await patchVideoMeta(video.id, meta);
  } catch (err) {
    console.warn("Enrichment skipped:", err.message);
  }

  res.status(201).json(video);
}

/** GET /api/videos?page=&limit=&status=&q= */
export async function list(req, res) {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit || "10", 10), 1),
    100
  );
  const status = req.query.status || null;
  const q = req.query.q || null;

  const { items, total } = await listVideos({
    owner: req.user.sub,
    isAdmin: req.user.role === "admin",
    page,
    limit,
    status,
    q,
  });

  res.json({ page, limit, total, items });
}

export async function getOne(req, res) {
  const v = await getVideoById(req.params.id);
  if (!v) return res.status(404).json({ error: "not found" });
  if (req.user.role !== "admin" && v.owner !== req.user.sub)
    return res.status(403).json({ error: "forbidden" });
  res.json(v);
}

export async function updateOne(req, res) {
  const allowed = ["external_title", "external_overview", "status"];
  const fields = {};
  for (const k of allowed) if (k in req.body) fields[k] = req.body[k];

  if (!Object.keys(fields).length)
    return res.status(400).json({ error: "no updatable fields" });

  const v = await getVideoById(req.params.id);
  if (!v) return res.status(404).json({ error: "not found" });
  if (req.user.role !== "admin" && v.owner !== req.user.sub)
    return res.status(403).json({ error: "forbidden" });

  await updateVideoFields(req.params.id, fields);
  res.json({ ok: true });
}

export async function removeOne(req, res) {
  const v = await getVideoById(req.params.id);
  if (!v) return res.status(404).json({ error: "not found" });

  try {
    if (v.path) fs.unlinkSync(v.path);
  } catch {}
  try {
    if (v.thumbnail_path) fs.unlinkSync(v.thumbnail_path);
  } catch {}

  await deleteVideo(req.params.id);
  res.json({ ok: true });
}

export async function downloadOne(req, res) {
  const v = await getVideoById(req.params.id);
  if (!v) return res.status(404).json({ error: "not found" });
  if (!v.s3_key) return res.status(400).json({ error: "no s3 key stored" });

  try {
    const url = await getS3DownloadUrl(v.s3_key);
    res.json({ downloadUrl: url });
  } catch (err) {
    console.error("S3 download error:", err);
    res.status(500).json({ error: "could not generate download link" });
  }
}
