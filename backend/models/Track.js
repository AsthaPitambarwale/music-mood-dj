const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema(
  {
    title: String,
    artist: String,
    url: String,
    publicId: String,
    duration: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Track", trackSchema);
