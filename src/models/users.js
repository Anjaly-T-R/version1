import { pool } from '../db/pool.js';

export async function createUser(email, passwordHash, role = 'user') {
  const result = await pool.query(
    `INSERT INTO s408.users (email, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [email, passwordHash, role]
  );
  return result.rows[0].id;
}

export async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT * FROM s408.users WHERE email=$1`,
    [email]
  );
  return result.rows[0] || null;
}

