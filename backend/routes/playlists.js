import express from "express";
import { 
  createPlaylist, 
  getPlaylist 
} from "../controllers/playlistController.js";

const router = express.Router();

router.post("/", createPlaylist);

router.get("/:id", getPlaylist);

export default router;
