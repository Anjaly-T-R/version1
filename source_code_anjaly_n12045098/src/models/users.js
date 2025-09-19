import { getConn } from '../db/pool.js';

export async function createUser(email, passwordHash, role='user') {
  const conn = await getConn();
  try {
    const r = await conn.query('INSERT INTO users(email, password_hash, role) VALUES (?, ?, ?)',
      [email, passwordHash, role]);
    return r.insertId;
  } finally { conn.release(); }
}

export async function findUserByEmail(email) {
  const conn = await getConn();
  try {
    const rows = await conn.query('SELECT * FROM users WHERE email=?', [email]);
    return rows[0] || null;
  } finally { conn.release(); }
}
