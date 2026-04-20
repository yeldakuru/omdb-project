import axios from "axios";

export const fetchMovies = async (req, res) => {
    const { title, type, year, page, genre } = req.query;

    if (!title) {
        return res.status(400).json({ error: "Title is required" });
    }

    try {
        const response = await axios.get(process.env.API_BASE, {
            params: {
                apikey: process.env.API_KEY,
                s: title,
                type, // optional
                y: year,
                genre, // optional
                page
            }
        });

        if (response.data.Response === "False") {
            return res.status(404).json({ error: "No results found" });
        }

        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

export const fetchMovieById = async (req, res) => {
    const { id } = req.params;

    try {
        const response = await axios.get(process.env.API_BASE, {
            params: {
                apikey: process.env.API_KEY,
                id: id,
                plot: "full"
            }
        });

        if (response.data.Response === "False") {
            return res.status(404).json({ error: "Content not found" });
        }

        res.json(response.data);
    } catch {
        res.status(500).json({ error: "Server error" });
    }
};