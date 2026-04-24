import { fetchMovies, fetchMovieById, getAutocomplete, getTop10 } from "../controllers/contentController.js";
import express from "express";

const router = express.Router();

router.get("/", fetchMovies);
router.get("/autocomplete", getAutocomplete);
router.get("/top10", getTop10);
router.get("/:id", fetchMovieById);
export default router;