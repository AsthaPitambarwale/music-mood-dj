const Track = require('../models/Track');
const multer = require('multer');
const path = require('path');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

async function uploadTrack(req, res) {
  try {
    const { title, artist } = req.body;
    const file = req.file;
    if (!file) return res.status(400).send("No file uploaded");

    const track = new Track({
      title,
      artist,
      filePath: `/uploads/${file.filename}`
    });
    await track.save();
    res.json(track);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listTracks(req, res) {
  const tracks = await Track.find();
  res.json(tracks);
}

module.exports = { upload, uploadTrack, listTracks };
