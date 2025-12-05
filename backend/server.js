import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import playlistRoutes from "./routes/playlists.js";
import statsRoutes from "./routes/statsRoutes.js"; // fixed
import trackRoutes from "./routes/tracks.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✔"))
  .catch((err) => console.log("Mongo Error:", err));

app.use("/api/tracks", trackRoutes);       // Upload + List
app.use("/api/playlists", playlistRoutes); // Generate + Get
app.use("/api/stats", statsRoutes);        // Top Tracks + Increment Play

app.get("/", (req, res) => res.send("Backend Running ✔"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
