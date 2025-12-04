import Track from "../models/Track.js";

let cache = null;
let cacheExpiry = 0;

export async function getTopTracks(req, res) {
  try {
    const now = Date.now();

    if (cache && now < cacheExpiry) {
      return res.json(cache);
    }

    const topTracks = await Track.find()
      .sort({ playCount: -1 })
      .limit(10);

    cache = topTracks;
    cacheExpiry = now + 60 * 1000;

    res.json(topTracks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function incrementPlayCount(req, res) {
  try {
    const { id } = req.params;

    const track = await Track.findById(id);
    if (!track) {
      return res.status(404).json({ error: "Track not found" });
    }

    track.playCount += 1;
    await track.save();

    // Clear cache since top tracks changed
    cache = null;
    cacheExpiry = 0;

    res.json({
      message: "Play count updated",
      playCount: track.playCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
