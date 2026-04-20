const axios = require("axios");
const { getCache, setCache } = require("../utils/cache");


exports.fetchMovies = async (req, res) => {
    const { title, type, year, page, genre } = req.query;

    if (!title) {
        return res.status(400).json({ error: "Title is required" });
    }

    const cacheKey = `${title?.toLowerCase()}-${type}-${year}-${page}-${genre}`;

    const cached = getCache(cacheKey);
    if (cached) {
        console.log("From cache");
        return res.json(cached);
    }

    try {
        const response = await axios.get(process.env.API_BASE, {
            params: {
                apikey: process.env.API_KEY,
                s: title,
                type,
                y: year,
                page
            }
        });

        if (response.data.Response === "False") {
            return res.status(404).json({ error: "No results found" });
        }


        setCache(cacheKey, response.data, 60000);

        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


exports.fetchMovieById = async (req, res) => {
    const { id } = req.params;

    const cacheKey = `detail-${id}`;

    const cached = getCache(cacheKey);
    if (cached) {
        console.log("Detail from cache");
        return res.json(cached);
    }

    try {
        const response = await axios.get(process.env.API_BASE, {
            params: {
                apikey: process.env.API_KEY,
                i: id,
                plot: "full"
            }
        });

        if (response.data.Response === "False") {
            return res.status(404).json({ error: "Content not found" });
        }


        setCache(cacheKey, response.data, 60000);

        res.json(response.data);
    } catch {
        res.status(500).json({ error: "Server error" });
    }
};