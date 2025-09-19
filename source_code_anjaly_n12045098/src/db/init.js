import { getConn } from './pool.js';

export async function initDb() {
  const conn = await getConn();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('user','admin') DEFAULT 'user'
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner INT NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        path VARCHAR(512) NOT NULL,
        size BIGINT,
        status ENUM('uploaded','processing','done','error') DEFAULT 'uploaded',
        external_source ENUM('TMDB','OMDB') NULL,
        external_id VARCHAR(64) NULL,
        external_title VARCHAR(255) NULL,
        external_overview TEXT NULL,
        poster_url VARCHAR(512) NULL,
        runtime_sec INT NULL,
        thumbnail_path VARCHAR(512) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_owner_name (owner, original_name),
        INDEX idx_videos_status(status),
        INDEX idx_videos_title(external_title)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        video_id INT NOT NULL,
        preset VARCHAR(50),
        status ENUM('queued','running','done','error') DEFAULT 'queued',
        progress TINYINT NOT NULL DEFAULT 0,
        cpu_avg DECIMAL(5,2) NULL,
        started_at TIMESTAMP NULL,
        finished_at TIMESTAMP NULL,
        INDEX idx_jobs_status(status)
      )
    `);
  } finally {
    conn.release();
  }
}
