import mongoose from "mongoose";

const trackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: String, default: "Unknown" },
    url: { type: String, required: true }, // uploaded file URL
    publicId: { type: String },
    duration: { type: Number },
    mood: { type: String },
    playCount: { type: Number, default: 0 } // REQUIRED for top tracks + mix
  },
  { timestamps: true }
);

const Track = mongoose.model("Track", trackSchema);
export default Track;
