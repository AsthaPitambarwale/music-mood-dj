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
    const { title, artist, mood } = req.body; // get mood from frontend
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const cloud = await cloudinary.v2.uploader.upload(file.path, {
      resource_type: "video", // keep for audio/video
    });

    fs.unlinkSync(file.path);

    // Create track with mood
    const track = new Track({
      title: title || "Unknown",
      artist: artist || "Unknown",
      mood: mood || "unknown", // default to unknown if empty
      url: cloud.secure_url,
      publicId: cloud.public_id,
    });

    await track.save();

    res.json(track); // return full track including mood
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function listTracks(req, res) {
  try {
    const tracks = await Track.find();
    res.json(tracks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
