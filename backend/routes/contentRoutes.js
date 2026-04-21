import { fetchMovies, fetchMovieById, getAutocomplete } from "../controllers/contentController.js";
import express from "express";

const router = express.Router();

router.get("/", fetchMovies);
router.get("/:id", fetchMovieById);
router.get("/autocomplete", getAutocomplete);
export default router;