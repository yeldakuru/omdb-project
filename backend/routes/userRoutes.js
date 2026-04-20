import auth from "../middleware/authMiddleware.js";
import { getWatchlist, addToWatchlist } from "../controllers/userController.js";
import express from "express";

const router = express.Router();

router.get("/watchlist", auth, getWatchlist);
router.post("/watchlist", auth, addToWatchlist);

export default router;