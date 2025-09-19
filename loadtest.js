import fetch from "node-fetch";

const URL = process.env.URL || "http://localhost:4000";
const TOKEN = process.env.TOKEN;
const VIDEO_ID = process.env.VIDEO_ID;
const JOBS = parseInt(process.env.JOBS || "200", 10);
const PAR = parseInt(process.env.PARALLEL || "8", 10);
const PRESET = process.env.PRESET || "720p";

if (!TOKEN || !VIDEO_ID) {
  console.error("Set TOKEN and VIDEO_ID env vars!");
  process.exit(1);
}

const headers = { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" };
async function submitJob() {
  const res = await fetch(`${URL}/api/jobs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ videoId: VIDEO_ID, preset: PRESET })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

let active = 0, done = 0, fail = 0, i = 0;

function next() {
  if (i >= JOBS) return;
  i++; active++;
  submitJob()
    .then(() => process.stdout.write("."))
    .catch(() => process.stdout.write("x"))
    .finally(() => { active--; next(); });
}

for (let k = 0; k < PAR; k++) next();

const timer = setInterval(() => {
  if (i >= JOBS && active === 0) {
    console.log(`\nFinished: ok=${done} fail=${fail}`);
    clearInterval(timer);
  }
}, 500);
