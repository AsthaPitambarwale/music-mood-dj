import Track from "../models/Track.js";

/**
 * Get top played tracks
 */
export async function getTopTracks(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const tracks = await Track.find()
      .sort({ playCount: -1 })
      .limit(limit);

    return res.json(tracks);
  } catch (err) {
    console.error("getTopTracks error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Increment play count for a track
 */
export async function incrementPlayCount(req, res) {
  try {
    const trackId = req.params.id;

    const track = await Track.findById(trackId);
    if (!track) {
      return res.status(404).json({ error: "Track not found" });
    }

    track.playCount = (track.playCount || 0) + 1;
    await track.save();

    return res.json({ success: true, playCount: track.playCount });
  } catch (err) {
    console.error("incrementPlayCount error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
