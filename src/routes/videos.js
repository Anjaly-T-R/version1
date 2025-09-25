// import { Router } from 'express';
// import { auth } from '../middleware/auth.js';
// import { uploadMw, uploadAndEnrich, list, getOne, updateOne, removeOne } from '../controllers/videos.js';

// const r = Router();
// r.post('/upload', auth, uploadMw, uploadAndEnrich);
// r.get('/', auth, list);                      // supports ?page&limit&status&q
// r.get('/:id', auth, getOne);
// r.put('/:id', auth, updateOne);
// r.delete('/:id', auth, removeOne);
// export default r;

const express = require("express");
const router = express.Router();
const { videoUpload, getPublicUrl } = require("../../s3services");
const Video = require("../models/videos"); // your DB model

router.post("/upload", videoUpload.single("video"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const fileKey = req.file.key; // multer-s3 adds this
    const s3Url = getPublicUrl(fileKey);

    // Save metadata in DB
    const newVideo = await Video.create({
      title,
      description,
      user_id: req.user.id,
      s3_url: s3Url
    });

    res.json({ success: true, video: newVideo });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
});


router.get("/", async (req, res) => {
  try {
    const videos = await Video.findAll();
    res.json({ success: true, videos });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load videos" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: "Not found" });

    // Extract S3 key from URL
    const fileKey = video.s3_url.split(".com/")[1];
    await deleteFile(fileKey);

    await video.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});

