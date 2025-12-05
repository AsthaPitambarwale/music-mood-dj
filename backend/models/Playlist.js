import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
  {
    mood: { type: String, required: true },

    tracks: [
      {
        trackId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Track",
          required: true,
        },
        order: { type: Number, default: 1 },
        weight: { type: Number, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Playlist ||
  mongoose.model("Playlist", playlistSchema);
