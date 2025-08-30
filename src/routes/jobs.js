import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createJobCtrl, getJobCtrl, listJobsCtrl } from '../controllers/jobs.js';

const r = Router();
r.post('/', auth, createJobCtrl);
r.get('/', auth, listJobsCtrl);
r.get('/:id', auth, getJobCtrl);
export default r;
