import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { uploadMw, uploadAndEnrich, list, getOne, updateOne, removeOne } from '../controllers/videos.js';

const r = Router();
r.post('/upload', auth, uploadMw, uploadAndEnrich);
r.get('/', auth, list);                      // supports ?page&limit&status&q
r.get('/:id', auth, getOne);
r.put('/:id', auth, updateOne);
r.delete('/:id', auth, removeOne);
export default r;
