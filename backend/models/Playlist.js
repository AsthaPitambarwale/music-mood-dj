const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  mood: String,
  tracks: [{
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track' },
    order: Number,
    weight: Number
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Playlist', playlistSchema);
