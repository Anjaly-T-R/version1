import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./src/db/init.js";
import routes from "./src/routes/index.js";

const app = express();
app.use(cors());
app.use(express.json());

// Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve the frontend
app.use(express.static(path.join(__dirname, "src", "public")));

// Static for uploaded files
app.use("/uploads", express.static(path.join(__dirname, "data", "uploads")));

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// API routes
app.use("/api", routes);

// Serve index.html for SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "public", "index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// Convert BigInt values to strings when sending JSON
app.set("json replacer", (k, v) => (typeof v === "bigint" ? v.toString() : v));

const port = process.env.PORT || 4000;

initDb()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
    });
  })
  .catch((err) => {
    console.error("❌ DB init failed:", err);
    process.exit(1);
  });