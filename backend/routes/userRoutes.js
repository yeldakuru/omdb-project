import auth from "../middleware/authMiddleware.js";
import { getWatchlist, addToWatchlist, removeFromWatched, removeFromWatchlist, getWatched, addToWatched } from "../controllers/userController.js";
import express from "express";

const router = express.Router();

router.get("/watchlist", auth, getWatchlist);
router.post("/watchlist", auth, addToWatchlist);
router.get("/watched", auth, getWatched);
router.post("/watched", auth, addToWatched);
router.delete("/watched/:id", auth, removeFromWatched);
router.delete("/watchlist/:id", auth, removeFromWatchlist);
export default router;