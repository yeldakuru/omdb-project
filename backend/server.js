const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());

const API_KEY = process.env.API_KEY;
const API_BASE = process.env.API_BASE;

app.get("/movie", async (req, res) => {
    try {
        const title = req.query.title;

        if (!title) {
            return res.status(400).json({ error: "Title is required" });
        }

        const response = await axios.get(API_BASE, {
            params: {
                apikey: API_KEY,
                t: title
            }
        });

        const data = response.data;

        if (data.Response === "False") {
            return res.status(404).json({ error: "Movie not found" });
        }

        res.json({
            title: data.Title,
            year: data.Year,
            genre: data.Genre,
            director: data.Director,
            poster: data.Poster,
            rating: data.imdbRating
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});