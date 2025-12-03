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
