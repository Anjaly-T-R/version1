
import { Router } from "express";
import {
  uploadMw,
  uploadAndEnrich,
  list,
  getOne,
  updateOne,
  removeOne,
  downloadOne
} from "../controllers/videos.js";
import { createJobCtrl, listJobsCtrl, getJobCtrl } from "../controllers/jobs.js";
import { cognitoSignUp, cognitoConfirm, cognitoLogin } from "../controllers/cognitoAuth.js";
import { authCognito } from "../middleware/cognitoAuthMiddleware.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";


const r = Router();

// Cognito
r.post("/auth/signup", cognitoSignUp);
r.post("/auth/confirm", cognitoConfirm);
r.post("/auth/login", cognitoLogin);

// Videos
r.post("/videos/upload", authCognito, uploadMw, uploadAndEnrich);
r.get("/videos", authCognito, list);
r.get("/videos/:id", authCognito, getOne);
r.get("/videos/:id/download", authCognito, downloadOne);
//admin only
r.put("/videos/:id", authCognito, requireAuth, requireAdmin, updateOne);
r.delete("/videos/:id", authCognito, requireAuth, requireAdmin, removeOne);

// Jobs
r.post("/jobs", authCognito, createJobCtrl);
r.get("/jobs", authCognito, listJobsCtrl);
r.get("/jobs/:id", authCognito, getJobCtrl);

export default r;

