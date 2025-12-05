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

    const cleanMood = mood.trim();

    /** 1) Fetch mood-based tracks */
    let moodTracks = await Track.find({
      mood: { $regex: cleanMood, $options: "i" }
    });

    if (!moodTracks.length) {
      console.warn(`⚠ No mood tracks for "${cleanMood}". Using all tracks.`);
      moodTracks = await Track.find();
    }

    /** Prepare lookup maps */
    const idMap = new Map();
    const titleMap = new Map();

    moodTracks.forEach(t => {
      idMap.set(t._id.toString(), t);
      titleMap.set(t.title.toLowerCase(), t);
    });

    /** 2) Fetch playlist suggestion from LLM */
    let llm = [];
    try {
      llm = await generatePlaylist(cleanMood, moodTracks);
      console.log("LLM returned:", llm);
    } catch (e) {
      console.error("❌ LLM error:", e);
    }

    const tracksData = [];

    /** 3) Convert LLM response to actual DB tracks */
    if (Array.isArray(llm) && llm.length > 0) {
      for (let item of llm) {
        let track = null;

        /** A) Try ID */
        if (item.trackId && idMap.has(item.trackId.toString())) {
          track = idMap.get(item.trackId.toString());
        }

        /** B) Try direct title (must exist) */
        if (!track && item.title) {
          const lower = item.title.toLowerCase();
          if (titleMap.has(lower)) track = titleMap.get(lower);
        }

        /** C) Fuzzy match (substr) */
        if (!track && item.title) {
          const low = item.title.toLowerCase();
          track = moodTracks.find(
            t =>
              t.title.toLowerCase().includes(low) ||
              low.includes(t.title.toLowerCase())
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

    /** 4) If LLM completely fails → fallback */
    if (tracksData.length === 0) {
      console.warn("⚠ LLM mapping failed. Using fallback random playlist.");

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

    /** 5) Save to DB */
    const playlist = new Playlist({
      mood: cleanMood,
      tracks: tracksData
    });

    await playlist.save();

    /** 6) Populate and return final playlist */
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

    res.json(playlist);
  } catch (err) {
    console.error("❌ Get playlist error:", err);
    res.status(500).json({ error: err.message });
  }
}
