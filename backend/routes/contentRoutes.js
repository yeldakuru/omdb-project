import { fetchMovies, fetchMovieById, getAutocomplete, getTop10 } from "../controllers/contentController.js";
import express from "express";

const router = express.Router();

router.get("/", fetchMovies);
router.get("/:id", fetchMovieById);
router.get("/autocomplete", getAutocomplete);
router.get("/getTop10", getTop10);
export default router;