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

export const getAutocomplete = async (req, res) => {
    const { q } = req.query;

    // 3 harf sınırı API'yi boşuna yormaz, profesyonel bir harekettir
    if (!q || q.length < 3) return res.json([]);

    const cacheKey = `auto-${q.toLowerCase()}`;
    const cached = getCache(cacheKey);

    if (cached) return res.json(cached);

    try {
        const response = await axios.get(process.env.API_BASE, {
            params: {
                apikey: process.env.API_KEY,
                s: q
            }
        });

        const results = response.data.Search
            ? response.data.Search.slice(0, 5).map(m => ({
                title: m.Title,
                year: m.Year,
                imdbID: m.imdbID,
                poster: m.Poster
            }))
            : [];

        setCache(cacheKey, results, 300000);
        res.json(results);

    } catch (err) {
        res.status(500).json({ error: "Autocomplete server error" });
    }
};

export const getTop10 = async (req, res) => {
    const API_KEY = process.env.API_KEY;
    const cacheKey = "top10";

    if (cache[cacheKey]) {
        console.log("Top10 from cache");
        return res.json(cache[cacheKey]);
    }

    try {

        const requests = TOP_IDS.map(id =>
            axios.get(`http://www.omdbapi.com/?apikey=${API_KEY}&i=${id}&plot=short`)
                .then(r => r.data)
                .catch(() => null)
        );

        const results = await Promise.all(requests); // paralel istek
        const content = results.filter(m => m && m.Response === "True");

        // cache for 1 hour, top10 doesn't change often
        cache[cacheKey] = content;
        setCache(cacheKey, content, 3600000);

        res.json(content);
    } catch (err) {
        console.error("Top10 error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
};
