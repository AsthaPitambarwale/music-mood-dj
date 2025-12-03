import express from "express";
import cors from "cors";
import multer from "multer";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import dotenv from "dotenv";

import Track from "./models/track.js"; // <-- USE EXISTING MODEL

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo Error:", err));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  try {
    const stream = Readable.from(req.file.buffer);

    const result = await new Promise((resolve, reject) => {
      const cloudStream = cloudinary.uploader.upload_stream(
        { resource_type: "video" }, // for audio & video
        (error, result) => (error ? reject(error) : resolve(result))
      );

      stream.pipe(cloudStream);
    });

    const track = await Track.create({
      title: req.body.title || req.file.originalname,
      artist: req.body.artist || "Unknown",
      url: result.secure_url,
      publicId: result.public_id,
      duration: req.body.duration || null,
    });

    res.json({
      message: "File uploaded successfully",
      track,
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

app.get("/tracks", async (req, res) => {
  const tracks = await Track.find().sort({ createdAt: -1 });
  res.json(tracks);
});

app.get("/", (req, res) => res.send("Backend Running ✔"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
