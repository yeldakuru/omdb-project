import axios from "axios";
import { getCache, setCache } from "../utils/cache.js";



export const fetchMovies = async (req, res) => {
    const { title, type, year, page } = req.query;

    if (!title) {
        return res.status(400).json({ error: "Title is required" });
    }

    const cacheKey = [
        title?.toLowerCase(),
        type || "all",
        year || "all",
        page || 1
    ].join("-");

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
                page: page || 1
            }
        });

        if (response.data.Response === "False") {
            return res.status(404).json({ error: "No results found" });
        }

        setCache(cacheKey, response.data, 60000); // 1 min cache
        return res.json(response.data);

    } catch (err) {
        console.log("fetchMovies error:", err.message);
        return res.status(500).json({ error: "Server error" });
    }
};



export const fetchMovieById = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: "ID is required" });
    }

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
        return res.json(response.data);

    } catch (err) {
        console.log("fetchMovieById error:", err.message);
        return res.status(500).json({ error: "Server error" });
    }
};