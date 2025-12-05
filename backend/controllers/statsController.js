import Playlist from "../models/Playlist.js";
import Track from "../models/Track.js";
import { generatePlaylist } from "../services/llmService.js";

/**
 * Create playlist (POST /api/playlists/generate)
 */
export async function createPlaylist(req, res) {
  try {
    const { mood } = req.body;

    if (!mood || typeof mood !== "string") {
      return res.status(400).json({ error: "Mood is required" });
    }

    // 1) Find tracks with same mood (case-insensitive)
    let moodTracks = await Track.find({
      mood: { $regex: mood.trim(), $options: "i" }
    });

    if (!moodTracks || moodTracks.length === 0) {
      console.warn(`⚠️ No tracks found for mood "${mood}". Using all tracks.`);
      moodTracks = await Track.find();
    }

    // 2) Call LLM
    let llmResult = [];
    try {
      llmResult = await generatePlaylist(mood, moodTracks);
      console.log("🧠 LLM result:", llmResult);
    } catch (err) {
      console.error("❌ LLM error:", err);
      llmResult = [];
    }

    // 3) Prepare fast lookup maps
    const idMap = new Map(moodTracks.map(t => [t._id.toString(), t]));
    const titleMap = new Map(moodTracks.map(t => [t.title?.toLowerCase(), t]));

    const tracksData = [];

    // 4) Convert LLM response -> real DB tracks
    if (Array.isArray(llmResult) && llmResult.length) {
      for (let item of llmResult) {
        let track = null;

        // A) ID match
        if (item.trackId && idMap.has(item.trackId.toString())) {
          track = idMap.get(item.trackId.toString());
        }

        // B) Exact title match
        if (!track && item.title) {
          track = titleMap.get(String(item.title).toLowerCase());
        }

        // C) Fuzzy substring match
        if (!track && item.title) {
          const lower = item.title.toLowerCase();
          track = moodTracks.find(
            t =>
              t.title.toLowerCase().includes(lower) ||
              lower.includes(t.title.toLowerCase())
          );
        }

        if (!track) continue;

        tracksData.push({
          trackId: track._id,
          order: tracksData.length + 1,
          weight: item.weight ?? 1
        });

        if (tracksData.length >= 6) break;
      }
    }

    // 5) If LLM fails → fallback playlist (always works)
    if (tracksData.length === 0) {
      console.warn("⚠️ LLM mapping failed. Using fallback playlist.");

      const shuffled = [...moodTracks].sort(() => Math.random() - 0.5);
      const pick = shuffled.slice(0, Math.min(4, shuffled.length));

      pick.forEach((track, index) => {
        tracksData.push({
          trackId: track._id,
          order: index + 1,
          weight: 1
        });
      });
    }

    // 6) Save playlist
    const playlist = new Playlist({
      mood: mood.trim(),
      tracks: tracksData
    });

    await playlist.save();

    // Return populated playlist
    const full = await Playlist.findById(playlist._id).populate(
      "tracks.trackId"
    );

    return res.json(full);
  } catch (err) {
    console.error("❌ Playlist creation error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Get playlist by ID
 */
export async function getPlaylist(req, res) {
  try {
    const playlist = await Playlist.findById(req.params.id).populate(
      "tracks.trackId"
    );

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    return res.json(playlist);
  } catch (err) {
    console.error("❌ Get playlist error:", err);
    res.status(500).json({ error: err.message });
  }
}

export const getTopTracks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const tracks = await Track.find()
      .sort({ playCount: -1 })
      .limit(limit);

    res.json(tracks);
  } catch (err) {
    console.error("Error fetching top tracks:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export {
  getTopTracks
};
