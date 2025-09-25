import fs from 'fs';
import path from 'path';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import {
  insertVideo,
  patchVideoMeta,
  listVideos,
  getVideoById,
  updateVideoFields,
  deleteVideo,
  findVideoByOwnerAndName,
} from '../models/videos.js';
import { enrichByExternalAPI } from '../services/enrich.js';

// Multer temp dir; we'll move to data/uploads after checks
const upload = multer({ dest: 'data/tmp' });
export const uploadMw = upload.single('file');

// helper: probe duration
function probeDurationSec(filepath) {
  return new Promise(resolve => {
    ffmpeg.ffprobe(filepath, (err, data) => {
      if (err) return resolve(null);
      const streams = data?.streams || [];
      const fmt = data?.format || {};
      const dur = Number(fmt.duration || streams.find(s => s.duration)?.duration || 0);
      resolve(Number.isFinite(dur) && dur > 0 ? Math.round(dur) : null);
    });
  });
}

/**
 * Upload + Enrich:
 * - auth + 'file' required
 * - duplicate check by (owner, original_name)
 * - move tmp -> data/uploads
 * - insert DB row
 * - best-effort: set runtime_sec via ffprobe; enrich metadata
 */
export async function uploadAndEnrich(req, res) {
  if (!req.user?.sub) return res.status(401).json({ error: 'unauthorized' });
  if (!req.file) return res.status(400).json({ error: 'form-data field "file" required' });

  fs.mkdirSync('data/tmp', { recursive: true });
  fs.mkdirSync('data/uploads', { recursive: true });

  // duplicate check BEFORE moving/saving
  try {
    const duplicate = await findVideoByOwnerAndName(req.user.sub, req.file.originalname);
    if (duplicate) { try { fs.unlinkSync(req.file.path); } catch {} ; return res.status(409).json({ error: 'duplicate', video: duplicate }); }
  } catch {
    try { fs.unlinkSync(req.file.path); } catch {};
    return res.status(500).json({ error: 'duplicate check failed' });
  }

  const savePath = path.join('data', 'uploads', `${Date.now()}-${req.file.originalname}`);
  try {
    fs.renameSync(req.file.path, savePath);
  } catch {
    try { fs.unlinkSync(req.file.path); } catch {};
    return res.status(500).json({ error: 'failed to save file' });
  }

  let video;
  try {
    video = await insertVideo({
      owner: req.user.sub,
      originalName: req.file.originalname,
      path: savePath,
      size: req.file.size,
    });
  } catch (e) {
    try { fs.unlinkSync(savePath); } catch {};
    // 1062 requires UNIQUE(owner, original_name)
    if (e?.errno === 1062) {
      const dupe = await findVideoByOwnerAndName(req.user.sub, req.file.originalname);
      return res.status(409).json({ error: 'duplicate', video: dupe });
    }
    return res.status(500).json({ error: 'db insert failed' });
  }

  // best-effort: runtime_sec
  try {
    const sec = await probeDurationSec(savePath);
    if (sec) await patchVideoMeta(video.id, { runtime_sec: sec });
  } catch {}

  // best-effort: enrichment
  try {
    const meta = await enrichByExternalAPI(req.file.originalname);
    if (meta) await patchVideoMeta(video.id, meta);
  } catch (e) {
    console.warn('enrich skipped:', e.message);
  }

  return res.status(201).json(video);
}

/** GET /api/videos?page=&limit=&status=&q= */
export async function list(req, res) {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
  const status = req.query.status || null;
  const q = req.query.q || null;

  const { items, total } = await listVideos({
    owner: req.user.sub,
    isAdmin: req.user.role === 'admin',
    page, limit, status, q,
  });

  res.json({ page, limit, total, items });
}

export async function getOne(req, res) {
  const v = await getVideoById(req.params.id);
  if (!v) return res.status(404).json({ error: 'not found' });
  if (req.user.role !== 'admin' && v.owner !== req.user.sub) return res.status(403).json({ error: 'forbidden' });
  res.json(v);
}

export async function updateOne(req, res) {
  const allowed = ['external_title', 'external_overview', 'status'];
  const fields = {};
  for (const k of allowed) if (k in req.body) fields[k] = req.body[k];

  if (!Object.keys(fields).length) return res.status(400).json({ error: 'no updatable fields' });

  const v = await getVideoById(req.params.id);
  if (!v) return res.status(404).json({ error: 'not found' });
  if (req.user.role !== 'admin' && v.owner !== req.user.sub) return res.status(403).json({ error: 'forbidden' });

  await updateVideoFields(req.params.id, fields);
  res.json({ ok: true });
}

export async function removeOne(req, res) {
  const v = await getVideoById(req.params.id);
  if (!v) return res.status(404).json({ error: 'not found' });
  if (req.user.role !== 'admin' && v.owner !== req.user.sub) return res.status(403).json({ error: 'forbidden' });

  try { if (v.path) fs.unlinkSync(v.path); } catch {}
  try { if (v.thumbnail_path) fs.unlinkSync(v.thumbnail_path); } catch {}

  await deleteVideo(req.params.id);
  res.json({ ok: true });
}
