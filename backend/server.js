import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import fs from "fs";
import path from "path";

import trackRoutes from "./routes/tracks.js";
import playlistRoutes from "./routes/playlists.js";
import statsRoutes from "./routes/stats.js";

dotenv.config();
console.log("OPENAI_API_KEY =", process.env.OPENAI_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => res.send("Backend Running ✔"));

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const { title, artist, mood } = req.body;
    const filePath = path.resolve(req.file.path);

    const cloudResult = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto", // auto detects audio/video
    });

    fs.unlinkSync(filePath);

    const Track = (await import("./models/Track.js")).default;
    const track = new Track({
      title: title || req.file.originalname,
      artist: artist || "Unknown",
      mood: mood || "unknown",
      url: cloudResult.secure_url,
      publicId: cloudResult.public_id,
      duration: req.body.duration || null,
    });

    await track.save();

    res.json(track);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.use("/api/tracks", trackRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/stats", statsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
