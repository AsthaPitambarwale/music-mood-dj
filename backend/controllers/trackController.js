import Track from "../models/Track.js";
import multer from "multer";
import path from "path";
import cloudinary from "cloudinary";
import fs from "fs";

// multer local upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

export const upload = multer({ storage });

export async function uploadTrack(req, res) {
  try {
    const { title, artist } = req.body;
    const file = req.file;

    if (!file) return res.status(400).send("No file uploaded");

    const cloud = await cloudinary.v2.uploader.upload(file.path, {
      resource_type: "video",
    });

    // delete local file
    fs.unlinkSync(file.path);

    const track = new Track({
      title,
      artist,
      url: cloud.secure_url,
      publicId: cloud.public_id
    });

    await track.save();

    res.json(track);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function listTracks(req, res) {
  const tracks = await Track.find();
  res.json(tracks);
}
