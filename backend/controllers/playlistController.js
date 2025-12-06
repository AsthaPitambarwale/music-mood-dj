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

    /** 1) Fetch tracks matching mood */
    let moodTracks = await Track.find({
      mood: { $regex: cleanMood, $options: "i" }
    });

    if (!moodTracks.length) {
      console.warn(`⚠ No tracks found for mood "${cleanMood}". Using all tracks.`);
      moodTracks = await Track.find();
    }

    /** Prepare a quick lookup */
    const idMap = new Map();
    moodTracks.forEach(t => idMap.set(t._id.toString(), t));

    /** 2) Generate playlist via LLM */
    let llmResults = [];
    try {
      llmResults = await generatePlaylist(cleanMood, moodTracks);
      console.log("LLM returned:", llmResults);
    } catch (err) {
      console.error("❌ LLM generation failed:", err);
      llmResults = [];
    }

    const tracksData = [];

    /** 3) Map LLM result -> DB tracks */
    if (Array.isArray(llmResults)) {
      for (let item of llmResults) {
        const id = item.trackId?.toString();
        if (!idMap.has(id)) continue; // reject hallucinations

        const track = idMap.get(id);

        tracksData.push({
          trackId: track._id,
          order: tracksData.length + 1,
          weight: item.weight ?? 0.5
        });

        if (tracksData.length >= 6) break;
      }
    }

    /** 4) Fallback if LLM completely failed */
    if (tracksData.length === 0) {
      console.warn("⚠ LLM failed — using fallback playlist.");

      const fallback = moodTracks.slice(0, Math.min(4, moodTracks.length));
      fallback.forEach((track, index) => {
        tracksData.push({
          trackId: track._id,
          order: index + 1,
          weight: 0.5
        });
      });
    }

    /** 5) Save playlist */
    const playlist = new Playlist({
      mood: cleanMood,
      tracks: tracksData
    });

    await playlist.save();

    /** 6) Return populated playlist */
    const full = await Playlist.findById(playlist._id).populate("tracks.trackId");

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
    const playlist = await Playlist.findById(req.params.id).populate("tracks.trackId");

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    res.json(playlist);
  } catch (err) {
    console.error("❌ Get playlist error:", err);
    res.status(500).json({ error: err.message });
  }
}
