import { fetchMovies, fetchMovieById } from "../controllers/contentController";
const router = require("express").Router();

router.get("/", fetchMovies);
router.get("/:id", fetchMovieById);

module.exports = router;