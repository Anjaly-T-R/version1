// import mariadb from 'mariadb';

// export const pool = mariadb.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASS,
//   database: process.env.DB_NAME,
//   connectionLimit: 5
// });

// export async function getConn() {
//   return pool.getConnection();
// }

import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  max: 10, // maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function getConn() {
  return pool.connect();
}