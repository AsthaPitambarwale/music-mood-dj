import mongoose from "mongoose";

const trackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, default: "Unknown" },
    artist: { type: String, default: "Unknown" },
    url: { type: String, required: true },      
    publicId: { type: String },                   
    duration: { type: Number },
    playCount: { type: Number, default: 0 },     
    mood: { type: String, default: "unknown" }   
  },
  { timestamps: true }
);

const Track = mongoose.model("Track", trackSchema);
export default Track;
