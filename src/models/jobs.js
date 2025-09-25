import { getConn } from '../db/pool.js';

export async function createJob({ videoId, preset }) {
  const conn = await getConn();
  try {
    const r = await conn.query(
      'INSERT INTO jobs(video_id, preset, status, progress) VALUES (?, ?, "queued", 0)',
      [videoId, preset]
    );
    return Number(r.insertId);
  } finally { conn.release(); }
}

export async function updateJob(id, fields) {
  const conn = await getConn();
  try {
    const keys = Object.keys(fields);
    if (!keys.length) return 0;
    const set = keys.map(k => `${k}=?`).join(', ');
    const params = [...keys.map(k => fields[k]), id];
    const r = await conn.query(`UPDATE jobs SET ${set} WHERE id=?`, params);
    return r.affectedRows;
  } finally { conn.release(); }
}

export async function getJob(id) {
  const conn = await getConn();
  try {
    const rows = await conn.query('SELECT * FROM jobs WHERE id=?', [id]);
    return rows[0] || null;
  } finally { conn.release(); }
}

export async function listJobs({ page, limit }) {
  const conn = await getConn();
  try {
    const off = (page - 1) * limit;
    const totalRows = await conn.query('SELECT COUNT(*) as c FROM jobs', []);
    const items = await conn.query('SELECT * FROM jobs ORDER BY id DESC LIMIT ? OFFSET ?', [limit, off]);
    return { total: Number(totalRows[0].c), items };
  } finally { conn.release(); }
}
