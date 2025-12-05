import mongoose from "mongoose";

const trackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: String, default: "Unknown" },

    url: { type: String, required: true },

    publicId: { type: String },

    duration: { type: Number, default: 0 },

    playCount: { type: Number, default: 0 },

    mood: { type: String, default: "unknown" }
  },
  { timestamps: true }
);

export default mongoose.models.Track || mongoose.model("Track", trackSchema);
