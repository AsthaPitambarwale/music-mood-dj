import Playlist from "../models/Playlist.js";
import Track from "../models/Track.js";
import { generatePlaylist } from "../services/llmService.js";

export async function createPlaylist(req, res) {
  try {
    const { mood } = req.body;

    // Find tracks for mood
    let moodTracks = await Track.find({ mood: { $regex: mood, $options: "i" } });

    if (moodTracks.length === 0) {
      console.log("⚠️ No tracks found for mood:", mood, " → Using all tracks.");
      moodTracks = await Track.find();
    }

    const llmResult = await generatePlaylist(mood, moodTracks);

    if (!Array.isArray(llmResult) || llmResult.length === 0) {
      return res.status(400).json({ error: "Failed to generate playlist." });
    }

    // Map LLM results to actual track IDs
    const tracksData = llmResult
      .map((item, index) => {
        const track = moodTracks.find((t) => t.title.toLowerCase() === item.title.toLowerCase());
        if (!track) return null;
        return {
          trackId: track._id,
          order: index + 1,
          weight: item.weight ?? 1,
        };
      })
      .filter(Boolean);

    if (tracksData.length === 0) {
      return res.status(400).json({ error: "No matching tracks found for the playlist." });
    }

    const playlist = new Playlist({
      mood,
      tracks: tracksData,
    });

    await playlist.save();

    res.json(playlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function getPlaylist(req, res) {
  try {
    const playlist = await Playlist.findById(req.params.id).populate("tracks.trackId");
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
