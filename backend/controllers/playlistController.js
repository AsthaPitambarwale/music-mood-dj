import Playlist from "../models/Playlist.js";
import Track from "../models/Track.js";
import { generatePlaylist } from "../services/llmService.js";

export async function createPlaylist(req, res) {
  try {
    const { mood } = req.body;

    const allTracks = await Track.find();

    const llmResult = await generatePlaylist(mood, allTracks);

    const tracksData = [];

    for (let i = 0; i < llmResult.length; i++) {
      const item = llmResult[i];

      const track = allTracks.find(t => t.title === item.title);

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

    const playlist = new Playlist({ mood, tracks: tracksData });
    await playlist.save();

    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPlaylist(req, res) {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate("tracks.trackId");

    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
