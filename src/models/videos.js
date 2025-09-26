import { pool } from '../db/pool.js';

export async function insertVideo({ owner, original_name, path, size }) {
  const result = await pool.query(
    `INSERT INTO s408.videos (owner, original_name, path, size)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [owner, original_name, path, size]
  );
  return result.rows[0];
}

export async function patchVideoMeta(id, meta = {}) {
  const allowed = [
    'external_title',
    'external_overview',
    'external_source',
    'external_id',
    'poster_url',
    'runtime_sec',
    'thumbnail_path',
    'status'
  ];
  const fields = {};
  for (const k of allowed) if (k in meta) fields[k] = meta[k];
  if (!Object.keys(fields).length) return 0;

  const keys = Object.keys(fields);
  const set = keys.map((k, i) => `${k}=$${i + 1}`).join(', ');
  const params = [...Object.values(fields), id];

  const result = await pool.query(
    `UPDATE s408.videos SET ${set} WHERE id=$${params.length} RETURNING *`,
    params
  );
  return result.rowCount;
}

export async function listVideos({ owner, isAdmin, page, limit, status, q }) {
  const where = [];
  const params = [];
  let paramIndex = 1;

  if (!isAdmin) { where.push(`owner=$${paramIndex++}`); params.push(owner); }
  if (status) { where.push(`status=$${paramIndex++}`); params.push(status); }
  if (q) {
    where.push(`(external_title ILIKE $${paramIndex} OR original_name ILIKE $${paramIndex + 1})`);
    params.push(`%${q}%`, `%${q}%`);
    paramIndex += 2;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const off = (page - 1) * limit;

  const totalResult = await pool.query(`SELECT COUNT(*) as c FROM s408.videos ${whereSql}`, params);
  const itemsResult = await pool.query(
    `SELECT * FROM s408.videos ${whereSql} ORDER BY id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, off]
  );

  return { total: Number(totalResult.rows[0].c), items: itemsResult.rows };
}

export async function getVideoById(id) {
  const result = await pool.query(`SELECT * FROM s408.videos WHERE id=$1`, [id]);
  return result.rows[0] || null;
}

export async function updateVideoFields(id, fields) {
  const keys = Object.keys(fields);
  if (!keys.length) return 0;

  const set = keys.map((k, i) => `${k}=$${i + 1}`).join(', ');
  const params = [...Object.values(fields), id];

  const result = await pool.query(
    `UPDATE s408.videos SET ${set} WHERE id=$${params.length} RETURNING *`,
    params
  );
  return result.rowCount;
}

export async function deleteVideo(id) {
  const result = await pool.query(`DELETE FROM s408.videos WHERE id=$1`, [id]);
  return result.rowCount;
}

export async function findVideoByOwnerAndName(owner, original_name) {
  const result = await pool.query(
    `SELECT * FROM s408.videos WHERE owner=$1 AND original_name=$2 LIMIT 1`,
    [owner, original_name]
  );
  return result.rows[0] || null;
}

