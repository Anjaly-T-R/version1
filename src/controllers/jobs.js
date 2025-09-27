import { createJob, getJob, listJobs, updateJob } from '../models/jobs.js';
import { startTranscode } from '../jobs/transcode.js';
import { cacheGet, cacheSet, cacheDel } from "../utils/cache.js";


export async function createJobCtrl(req, res) {
  const { videoId, preset='720p' } = req.body || {};
  if (!videoId) return res.status(400).json({ error: 'videoId required' });

  const id = await createJob({ videoId, preset });
  // async run
  startTranscode({ jobId: id, videoId, preset }).catch(e => {
    console.error('transcode failed', e);
  });
  await cacheDel("jobs:list");
  res.status(201).json({ id });
}

export async function getJobCtrl(req, res) {
  const j = await getJob(req.params.id);
  if (!j) return res.status(404).json({ error: 'not found' });
  res.json(j);
}

export async function listJobsCtrl(req, res) {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
  const cacheKey = `jobs:list:page=${page}:limit=${limit}`;

  try {
    let data = await cacheGet(cacheKey);

    if (!data) {
      console.log("Jobs cache miss → querying DB");
      data = await listJobs({ page, limit });
      await cacheSet(cacheKey, data, 120); // store for 2 minutes
    } else {
      console.log("Jobs cache hit");
    }

    res.json(data);
  } catch (err) {
    console.error("Jobs list error:", err);
    res.status(500).json({ error: "Failed to list jobs" });
  }
}

