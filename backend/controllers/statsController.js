import Track from "../models/Track.js";

let cache = null;
let cacheExpiry = 0;

export async function getTopTracks(req, res) {
  try {
    const now = Date.now();

    // return cached top tracks
    if (cache && now < cacheExpiry) {
      return res.json(cache);
    }

    const topTracks = await Track.find()
      .sort({ playCount: -1 })
      .limit(10)
      .lean(); // faster & no mongoose overhead

    cache = topTracks;
    cacheExpiry = now + 60 * 1000; // 1 min cache

    res.json(topTracks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function incrementPlayCount(req, res) {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid track ID format" });
    }

    const track = await Track.findById(id);

    if (!track) {
      return res.status(404).json({ error: "Track not found" });
    }

    track.playCount = (track.playCount || 0) + 1;

    await track.save();

    cache = null;
    cacheExpiry = 0;

    res.json({
      message: "Play count updated successfully",
      playCount: track.playCount,
      trackId: track._id
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
