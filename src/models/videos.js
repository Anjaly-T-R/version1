// src/models/videos.js - Updated for PostgreSQL
import { getConn } from '../db/pool.js';

export async function insertVideo({ owner, original_name, path, size }) {
  const client = await getConn();
  try {
    const result = await client.query(
      'INSERT INTO videos (owner, original_name, path, size) VALUES ($1, $2, $3, $4) RETURNING *',
      [owner, original_name, path, size]
    );
    return result.rows[0];
  } finally { 
    client.release(); 
  }
}

export async function patchVideoMeta(id, meta = {}) {
  const allowed = ['external_title', 'external_overview', 'external_source', 'external_id', 'poster_url', 'runtime_sec', 'thumbnail_path', 'status'];
  const fields = {};
  for (const k of allowed) if (k in meta) fields[k] = meta[k];
  if (!Object.keys(fields).length) return 0;

  const client = await getConn();
  try {
    const keys = Object.keys(fields);
    const setClause = keys.map((k, i) => `${k}=$${i + 1}`).join(', ');
    const values = [...Object.values(fields), id];
    
    const result = await client.query(
      `UPDATE videos SET ${setClause} WHERE id=$${keys.length + 1}`, 
      values
    );
    return result.rowCount;
  } finally { 
    client.release(); 
  }
}

export async function listVideos({ owner, isAdmin, page, limit, status, q }) {
  const client = await getConn();
  try {
    const where = [];
    const params = [];
    let paramIndex = 1;

    if (!isAdmin) { 
      where.push(`owner=$${paramIndex++}`); 
      params.push(owner); 
    }
    if (status) { 
      where.push(`status=$${paramIndex++}`); 
      params.push(status); 
    }
    if (q) { 
      where.push(`(external_title ILIKE $${paramIndex++} OR original_name ILIKE $${paramIndex++})`); 
      params.push(`%${q}%`, `%${q}%`); 
      paramIndex += 1; // Adjust for the second parameter
    }
    
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const totalResult = await client.query(
      `SELECT COUNT(*) as count FROM videos ${whereSql}`, 
      params
    );
    
    const itemsResult = await client.query(
      `SELECT * FROM videos ${whereSql} ORDER BY id DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );
    
    return { 
      total: parseInt(totalResult.rows[0].count), 
      items: itemsResult.rows 
    };
  } finally { 
    client.release(); 
  }
}

export async function getVideoById(id) {
  const client = await getConn();
  try {
    const result = await client.query('SELECT * FROM videos WHERE id=$1', [id]);
    return result.rows[0] || null;
  } finally { 
    client.release(); 
  }
}

export async function updateVideoFields(id, fields) {
  const client = await getConn();
  try {
    const keys = Object.keys(fields);
    if (!keys.length) return 0;
    
    const setClause = keys.map((k, i) => `${k}=$${i + 1}`).join(', ');
    const values = [...keys.map(k => fields[k]), id];
    
    const result = await client.query(
      `UPDATE videos SET ${setClause} WHERE id=$${keys.length + 1}`, 
      values
    );
    return result.rowCount;
  } finally { 
    client.release(); 
  }
}

export async function deleteVideo(id) {
  const client = await getConn();
  try {
    const result = await client.query('DELETE FROM videos WHERE id=$1', [id]);
    return result.rowCount;
  } finally { 
    client.release(); 
  }
}

export async function findVideoByOwnerAndName(owner, originalName) {
  const client = await getConn();
  try {
    const result = await client.query(
      'SELECT * FROM videos WHERE owner=$1 AND original_name=$2 LIMIT 1',
      [owner, originalName]
    );
    return result.rows[0] || null;
  } finally { 
    client.release(); 
  }
}