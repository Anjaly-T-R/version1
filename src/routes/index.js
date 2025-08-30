import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import * as A from '../controllers/auth.js';
import { uploadMw, uploadAndEnrich, list, getOne, updateOne, removeOne } from '../controllers/videos.js';
import { createJobCtrl, listJobsCtrl, getJobCtrl } from '../controllers/jobs.js';

const r = Router();

// auth
r.post('/auth/register', A.register);
r.post('/auth/login', A.login);

// videos
r.post('/videos/upload', auth, uploadMw, uploadAndEnrich);
r.get('/videos', auth, list);
r.get('/videos/:id', auth, getOne);
r.put('/videos/:id', auth, updateOne);
r.delete('/videos/:id', auth, removeOne);

// jobs
r.post('/jobs', auth, createJobCtrl);
r.get('/jobs', auth, listJobsCtrl);
r.get('/jobs/:id', auth, getJobCtrl);

export default r;
