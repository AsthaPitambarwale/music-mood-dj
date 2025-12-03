import express from "express";
import { upload, uploadTrack, listTracks } from "../controllers/trackController.js";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadTrack);

router.get("/", listTracks);

export default router;
