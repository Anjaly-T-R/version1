import { getConn } from '../db/pool.js';

export async function insertVideo({ owner, original_name, path, size }) {
  const conn = await getConn();
  try {
    const r = await conn.query(
      'INSERT INTO videos (owner, original_name, path, size) VALUES (?, ?, ?, ?)',
      [owner, original_name, path, size]
    );
    const rows = await conn.query('SELECT * FROM videos WHERE id=?', [r.insertId]);
    return rows[0];
  } finally {
    conn.release();
  }
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

  const conn = await getConn();
  try {
    const set = Object.keys(fields).map(k => `${k}=?`).join(', ');
    const params = [...Object.values(fields), id];
    const r = await conn.query(`UPDATE videos SET ${set} WHERE id=?`, params);
    return r.affectedRows;
  } finally {
    conn.release();
  }
}

export async function listVideos({ owner, isAdmin, page, limit, status, q }) {
  const conn = await getConn();
  try {
    const where = [];
    const params = [];
    if (!isAdmin) { where.push('owner=?'); params.push(owner); }
    if (status) { where.push('status=?'); params.push(status); }
    if (q) { where.push('(external_title LIKE ? OR original_name LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const off = (page - 1) * limit;

    const totalRows = await conn.query(`SELECT COUNT(*) as c FROM videos ${whereSql}`, params);
    const items = await conn.query(
      `SELECT * FROM videos ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, off]
    );
    return { total: Number(totalRows[0].c), items };
  } finally {
    conn.release();
  }
}

export async function getVideoById(id) {
  const conn = await getConn();
  try {
    const rows = await conn.query('SELECT * FROM videos WHERE id=?', [id]);
    return rows[0] || null;
  } finally {
    conn.release();
  }
}

export async function updateVideoFields(id, fields) {
  const conn = await getConn();
  try {
    const keys = Object.keys(fields);
    if (!keys.length) return 0;
    const set = keys.map(k => `${k}=?`).join(', ');
    const params = [...keys.map(k => fields[k]), id];
    const r = await conn.query(`UPDATE videos SET ${set} WHERE id=?`, params);
    return r.affectedRows;
  } finally {
    conn.release();
  }
}

export async function deleteVideo(id) {
  const conn = await getConn();
  try {
    const r = await conn.query('DELETE FROM videos WHERE id=?', [id]);
    return r.affectedRows;
  } finally {
    conn.release();
  }
}

export async function findVideoByOwnerAndName(owner, original_name) {
  const conn = await getConn();
  try {
    const rows = await conn.query(
      'SELECT * FROM videos WHERE owner=? AND original_name=? LIMIT 1',
      [owner, original_name]
    );
    return rows[0] || null;
  } finally {
    conn.release();
  }
}
