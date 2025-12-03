import mongoose from "mongoose";

const trackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: String, default: "Unknown" },
    url: { type: String, required: true },
    publicId: { type: String },
    duration: { type: Number },
  },
  { timestamps: true }
);

const Track = mongoose.model("Track", trackSchema);

export default Track;
