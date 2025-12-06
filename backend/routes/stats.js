import express from "express";
import { 
  getTopTracks, 
  incrementPlayCount 
} from "../controllers/statsController.js";

const router = express.Router();

router.get("/top", getTopTracks);
router.post("/play/:id", incrementPlayCount);

export default router;
