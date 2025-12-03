import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
  {
    mood: { type: String, required: true },
    tracks: [
      {
        trackId: { type: mongoose.Schema.Types.ObjectId, ref: "Track" },
        order: Number,
        weight: Number,
      },
    ],
  },
  { timestamps: true }
);

const Playlist = mongoose.model("Playlist", playlistSchema);
export default Playlist;
