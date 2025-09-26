import { pool } from '../db/pool.js';

export async function createJob({ videoId, preset }) {
  const result = await pool.query(
    `INSERT INTO s408.jobs (video_id, preset, status, progress)
     VALUES ($1, $2, 'queued', 0)
     RETURNING id`,
    [videoId, preset]
  );
  return result.rows[0].id;
}

export async function updateJob(id, fields) {
  const keys = Object.keys(fields);
  if (!keys.length) return 0;

  const set = keys.map((k, i) => `${k}=$${i + 1}`).join(', ');
  const params = [...Object.values(fields), id];

  const result = await pool.query(
    `UPDATE s408.jobs SET ${set} WHERE id=$${params.length} RETURNING *`,
    params
  );
  return result.rowCount;
}

export async function getJob(id) {
  const result = await pool.query(
    `SELECT * FROM s408.jobs WHERE id=$1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function listJobs({ page, limit }) {
  const off = (page - 1) * limit;
  const totalResult = await pool.query(`SELECT COUNT(*) as c FROM s408.jobs`);
  const itemsResult = await pool.query(
    `SELECT * FROM s408.jobs ORDER BY id DESC LIMIT $1 OFFSET $2`,
    [limit, off]
  );
  return { total: Number(totalResult.rows[0].c), items: itemsResult.rows };
}

