// I take Reference from AI tool to do all this assignment chatgpt4.5
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './src/db/init.js';
import routes from './src/routes/index.js';

const app = express();
app.use(cors());
app.use(express.json());


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'data', 'uploads')));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', routes);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});
// Convert all BigInt values to strings when sending JSON
app.set('json replacer', (k, v) => (typeof v === 'bigint' ? v.toString() : v));
const port = process.env.PORT || 4000;
initDb().then(() => {
  app.listen(port, '0.0.0.0', () => console.log(`API listening on :${port}`));
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
