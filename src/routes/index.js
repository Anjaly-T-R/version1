import { Router } from "express";
import { uploadMw, uploadAndEnrich, list, getOne, updateOne, removeOne } from "../controllers/videos.js";
import { createJobCtrl, listJobsCtrl, getJobCtrl } from "../controllers/jobs.js";
import { cognitoSignUp, cognitoConfirm, cognitoLogin } from "../controllers/cognitoAuth.js";
import { authCognito } from "../middleware/cognitoAuthMiddleware.js";

const r = Router();

// Cognito auth
r.post("/auth/signup", cognitoSignUp);
r.post("/auth/confirm", cognitoConfirm);
r.post("/auth/login", cognitoLogin);

// Videos
r.post("/videos/upload", authCognito, uploadMw, uploadAndEnrich);
r.get("/videos", authCognito, list);
r.get("/videos/:id", authCognito, getOne);
r.put("/videos/:id", authCognito, updateOne);
r.delete("/videos/:id", authCognito, removeOne);


r.post("/jobs", authCognito, createJobCtrl);
r.get("/jobs", authCognito, listJobsCtrl);
r.get("/jobs/:id", authCognito, getJobCtrl);

export default r;
