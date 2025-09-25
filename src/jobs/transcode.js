import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import { getVideoById, updateVideoFields } from '../models/videos.js';
import { updateJob } from '../models/jobs.js';

function presetArgs(preset, input, output) {
  if (preset === '720p') return ['-i', input, '-vf', 'scale=-2:720', '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', output];
  if (preset === '480p') return ['-i', input, '-vf', 'scale=-2:480', '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', output];
  return ['-i', input, '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', output];
}

// system-wide CPU snapshot (portable)
function cpuSnapshot() {
  const cpus = os.cpus();
  let idle = 0, total = 0;
  for (const c of cpus) {
    idle += c.times.idle;
    total += c.times.user + c.times.nice + c.times.sys + c.times.irq + c.times.idle;
  }
  return { idle, total };
}

// derive % CPU between two snapshots
function cpuPercent(s0, s1) {
  const idle = s1.idle - s0.idle;
  const total = s1.total - s0.total;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, 100 - (idle / total) * 100));
}

export async function startTranscode({ jobId, videoId, preset }) {
  const v = await getVideoById(videoId);
  if (!v) throw new Error('video not found');

  await updateVideoFields(videoId, { status: 'processing' });
  await updateJob(jobId, { status: 'running', started_at: new Date(), progress: 0 });

  // output path (keep alongside input, add preset suffix)
  const outPath = v.path.replace(/\.([a-z0-9]+)$/i, `.${preset}.mp4`);
  const args = presetArgs(preset, v.path, outPath);
  const p = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });

  // CPU sampling (system-wide)
  let lastSnap = cpuSnapshot();
  let samples = [];
  const cpuTimer = setInterval(async () => {
    const next = cpuSnapshot();
    const pct = cpuPercent(lastSnap, next);
    samples.push(pct);
    lastSnap = next;
    // write a rolling average so GET /jobs shows a live-ish number
    const avg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
    try { await updateJob(jobId, { cpu_avg: Number(avg.toFixed(2)) }); } catch {}
  }, 2000); // every 2s

  // progress parsing from ffmpeg stderr
  p.stderr.on('data', chunk => {
    const s = chunk.toString();
    // extract processed 'time=' from ffmpeg, needs runtime_sec known
    const m = s.match(/time=(\d+):(\d+):([\d.]+)/);
    if (m && v.runtime_sec) {
      const sec = (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
      const pct = Math.min(99, Math.floor((sec / v.runtime_sec) * 100));
      updateJob(jobId, { progress: pct }).catch(() => {});
    }
  });

  return new Promise(resolve => {
    p.on('close', async (code) => {
      clearInterval(cpuTimer);

      if (code === 0) {
        // finalize average CPU for the whole job
        const finalAvg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : null;
        await updateJob(jobId, {
          status: 'done',
          progress: 100,
          finished_at: new Date(),
          cpu_avg: finalAvg == null ? null : Number(finalAvg.toFixed(2)),
        });
        await updateVideoFields(videoId, { status: 'done' });

        // optional thumbnail (non-blocking)
        try {
          const thumb = v.path.replace(/\.([a-z0-9]+)$/i, `.thumb.jpg`);
          const tp = spawn('ffmpeg', ['-ss', '00:00:01', '-i', outPath, '-vframes', '1', thumb]);
          tp.on('close', () => {});
        } catch {}
      } else {
        await updateJob(jobId, { status: 'error', finished_at: new Date() });
        await updateVideoFields(videoId, { status: 'error' });
      }

      resolve();
    });

    p.on('error', async (err) => {
      clearInterval(cpuTimer);
      await updateJob(jobId, { status: 'error', finished_at: new Date() });
      await updateVideoFields(videoId, { status: 'error' });
      resolve();
    });
  });
}
