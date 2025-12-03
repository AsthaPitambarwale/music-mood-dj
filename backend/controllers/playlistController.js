const Playlist = require('../models/Playlist');
const Track = require('../models/Track');
const { generatePlaylist } = require('../services/llmService');

async function createPlaylist(req, res) {
  try {
    const { mood } = req.body;
    const allTracks = await Track.find();

    const llmResult = await generatePlaylist(mood, allTracks);
    const tracksData = llmResult.map((t, idx) => {
      const track = allTracks.find(a => a.title === t.title);
      if (track) {
        track.playCount += 1;
        track.save();
        return { trackId: track._id, order: idx + 1, weight: t.weight };
      }
      return null;
    }).filter(Boolean);

    const playlist = new Playlist({ mood, tracks: tracksData });
    await playlist.save();
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getPlaylist(req, res) {
  const playlist = await Playlist.findById(req.params.id).populate('tracks.trackId');
  res.json(playlist);
}

module.exports = { createPlaylist, getPlaylist };
