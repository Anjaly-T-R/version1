import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 5,
  ssl: { rejectUnauthorized: false }
});


export async function getConn() {
  const client = await pool.connect();
  return client;
}

