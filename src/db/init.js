import { getConn } from './pool.js';

export async function initDb() {
  const client = await getConn();
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS s408.users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user','admin'))
      )
    `);

    // Videos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS s408.videos (
        id SERIAL PRIMARY KEY,
        owner VARCHAR(255) NOT NULL,   -- changed from INT → VARCHAR
        original_name VARCHAR(255) NOT NULL,
        path VARCHAR(512) NOT NULL,
        size BIGINT,
        status VARCHAR(20) DEFAULT 'uploaded' CHECK (status IN ('uploaded','processing','done','error')),
        external_source VARCHAR(20) CHECK (external_source IN ('TMDB','OMDB')),
        external_id VARCHAR(64),
        external_title VARCHAR(255),
        external_overview TEXT,
        poster_url VARCHAR(512),
        runtime_sec INT,
        thumbnail_path VARCHAR(512),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (owner, original_name)
      )
    `);

    // Jobs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS s408.jobs (
        id SERIAL PRIMARY KEY,
        video_id INT NOT NULL REFERENCES s408.videos(id) ON DELETE CASCADE,
        preset VARCHAR(50),
        status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued','running','done','error')),
        progress SMALLINT NOT NULL DEFAULT 0,
        cpu_avg NUMERIC(5,2),
        started_at TIMESTAMP,
        finished_at TIMESTAMP
      )
    `);
  } finally {
    client.release();
  }
}

