import Playlist from "../models/Playlist.js";
import Track from "../models/Track.js";
import { generatePlaylist } from "../services/llmService.js";

export async function createPlaylist(req, res) {
  try {
    const { mood } = req.body;

    let moodTracks = await Track.find({
      mood: { $regex: mood, $options: "i" }
    });

    if (moodTracks.length === 0) {
      console.log(`⚠️ No tracks found for mood "${mood}". Using all tracks.`);
      moodTracks = await Track.find();
    }

    const llmResult = await generatePlaylist(mood, moodTracks);

    if (!Array.isArray(llmResult) || llmResult.length === 0) {
      return res.status(400).json({ error: "Failed to generate playlist." });
    }

    const tracksData = [];

    for (let i = 0; i < llmResult.length; i++) {
      const item = llmResult[i];

      if (!item.trackId) continue; // skip invalid items

      const track = moodTracks.find(
        t => t._id.toString() === item.trackId.toString()
      );

      if (track) {
        track.playCount += 1;
        await track.save();

        tracksData.push({
          trackId: track._id,
          order: i + 1,
          weight: item.weight ?? 1
        });
      }
    }

    if (tracksData.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid tracks were mapped from playlist generator." });
    }

    const playlist = new Playlist({
      mood,
      tracks: tracksData
    });

    await playlist.save();

    res.json(playlist);

  } catch (err) {
    console.error("❌ Playlist creation error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function getPlaylist(req, res) {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate("tracks.trackId");

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    res.json(playlist);
  } catch (err) {
    console.error("❌ Get playlist error:", err);
    res.status(500).json({ error: err.message });
  }
}
