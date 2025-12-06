import Track from "../models/Track.js";

export async function incrementPlayCount(req, res) {
  try {
    const { id } = req.params;

    const track = await Track.findById(id);
    if (!track) {
      return res.status(404).json({ error: "Track not found" });
    }

    track.playCount = (track.playCount || 0) + 1;
    await track.save();

    res.json({ success: true, playCount: track.playCount });
  } catch (err) {
    console.error("Play count error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function getTopTracks(req, res) {
  try {
    const top = await Track.find()
      .sort({ playCount: -1 })
      .limit(10);

    res.json(top);
  } catch (err) {
    console.error("Top tracks error:", err);
    res.status(500).json({ error: err.message });
  }
}
