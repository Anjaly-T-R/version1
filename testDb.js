// testDb.js
import 'dotenv/config';
import { pool } from './src/db/pool.js';

async function runTests() {
  const testEmail = 'test@example.com';

  try {
    console.log('🔎 Testing DB connection...');
    const now = await pool.query('SELECT NOW()');
    console.log('✅ Connected! Server time:', now.rows[0].now);

    // 1. Insert or reuse a test user
    const userResult = await pool.query(
      `INSERT INTO s408.users (email, password_hash, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, role`,
      [testEmail, 'hashedpassword123', 'user']
    );

    let userId;
    if (userResult.rows.length > 0) {
      console.log('👤 Inserted new user:', userResult.rows[0]);
      userId = userResult.rows[0].id;
    } else {
      const existing = await pool.query(
        `SELECT id, email, role FROM s408.users WHERE email=$1`,
        [testEmail]
      );
      console.log('👤 Reusing existing user:', existing.rows[0]);
      userId = existing.rows[0].id;
    }

    // 2. Insert a test video
    const videoResult = await pool.query(
      `INSERT INTO s408.videos (owner, original_name, path, size)
       VALUES ($1, $2, $3, $4)
       RETURNING id, owner, original_name`,
      [testEmail, 'sample.mp4', '/data/sample.mp4', 123456]
    );
    console.log('🎬 Inserted video:', videoResult.rows[0]);

    // 3. Insert a test job
    const jobResult = await pool.query(
      `INSERT INTO s408.jobs (video_id, preset, status, progress)
       VALUES ($1, $2, 'queued', 0)
       RETURNING id, video_id, preset, status`,
      [videoResult.rows[0].id, '720p']
    );
    console.log('⚙️ Inserted job:', jobResult.rows[0]);

    // 4. Fetch everything back
    const users = await pool.query(`SELECT * FROM s408.users WHERE email=$1`, [testEmail]);
    const videos = await pool.query(`SELECT * FROM s408.videos WHERE owner=$1`, [testEmail]);
    const jobs = await pool.query(
      `SELECT * FROM s408.jobs WHERE video_id=$1`,
      [videoResult.rows[0].id]
    );

    console.log('\n📋 Users:', users.rows);
    console.log('📋 Videos:', videos.rows);
    console.log('📋 Jobs:', jobs.rows);

    // 5. Cleanup test data
    await pool.query(`DELETE FROM s408.jobs WHERE video_id=$1`, [videoResult.rows[0].id]);
    await pool.query(`DELETE FROM s408.videos WHERE id=$1`, [videoResult.rows[0].id]);
    console.log('🧹 Cleaned up test data (jobs & videos). User kept for reuse.');
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    await pool.end();
  }
}

runTests();

