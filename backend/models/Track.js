const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  title: String,
  artist: String,
  filePath: String,
  duration: Number,
  uploadDate: { type: Date, default: Date.now },
  playCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('Track', trackSchema);
