import { fetchMovies, fetchMovieById } from "../controllers/contentController.js";
import express from "express";

const router = express.Router();

router.get("/", fetchMovies);
router.get("/:id", fetchMovieById);

export default router;