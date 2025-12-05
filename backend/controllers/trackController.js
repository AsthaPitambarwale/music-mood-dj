import Track from "../models/Track.js";
import multer from "multer";
import path from "path";
import cloudinary from "cloudinary";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

export const upload = multer({ storage });

export async function uploadTrack(req, res) {
  try {
    const { title, artist, mood } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const cloud = await cloudinary.v2.uploader.upload(file.path, {
      resource_type: "auto", // <— FIXED (audio/video)
    });

    // Delete local file after upload
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.warn("Failed deleting temp file:", err);
    }

    const track = new Track({
      title: title?.trim() || "Unknown",
      artist: artist?.trim() || "Unknown",
      mood: mood?.trim() || "unknown",
      url: cloud.secure_url,
      publicId: cloud.public_id,
    });

    await track.save();

    res.json(track);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function listTracks(req, res) {
  try {
    const tracks = await Track.find().sort({ createdAt: -1 });
    res.json(tracks);
  } catch (err) {
    console.error("List tracks error:", err);
    res.status(500).json({ error: err.message });
  }
}
