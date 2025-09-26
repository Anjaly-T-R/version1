import { getConn } from './pool.js';

export async function initDb() {
  const client = await getConn();
  try {
    // Create ENUM types first
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM('user', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE video_status AS ENUM('uploaded', 'processing', 'done', 'error');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE external_source AS ENUM('TMDB', 'OMDB');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE job_status AS ENUM('queued', 'running', 'done', 'error');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role user_role DEFAULT 'user'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        owner INTEGER NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        path VARCHAR(512) NOT NULL,
        size BIGINT,
        status video_status DEFAULT 'uploaded',
        external_source external_source NULL,
        external_id VARCHAR(64) NULL,
        external_title VARCHAR(255) NULL,
        external_overview TEXT NULL,
        poster_url VARCHAR(512) NULL,
        runtime_sec INTEGER NULL,
        thumbnail_path VARCHAR(512) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(owner, original_name)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_videos_title ON videos(external_title)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        video_id INTEGER NOT NULL,
        preset VARCHAR(50),
        status job_status DEFAULT 'queued',
        progress SMALLINT NOT NULL DEFAULT 0,
        cpu_avg DECIMAL(5,2) NULL,
        started_at TIMESTAMP NULL,
        finished_at TIMESTAMP NULL
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)
    `);

    console.log('✅ Database tables initialized successfully');
  } finally {
    client.release();
  }
}