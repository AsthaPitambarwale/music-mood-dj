const Track = require('../models/Track');

let cache = null;
let cacheExpiry = 0;

async function getTopTracks(req, res) {
  const now = Date.now();
  if (cache && now < cacheExpiry) return res.json(cache);

  const topTracks = await Track.find().sort({ playCount: -1 }).limit(10);
  cache = topTracks;
  cacheExpiry = now + 60 * 1000; // 1 min
  res.json(topTracks);
}

module.exports = { getTopTracks };
