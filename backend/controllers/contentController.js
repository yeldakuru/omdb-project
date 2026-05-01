import axios from "axios";
import { getCache, setCache } from "../utils/cache.js";

export const fetchMovies = async (req, res) => {
    const { title, type, year, page, genre } = req.query;

    if (!title) {
        return res.status(400).json({ error: "Title is required" });
    }

    const cacheKey = [
        title?.toLowerCase(),
        type || "all",
        year || "all",
        page || 1,
        genre || "all"
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

                ...(type && ["movie", "series", "episode"].includes(type) ? { type } : {}),
                ...(year ? { y: year } : {}),
                page: page || 1
            }
        });

        if (response.data.Response === "False") {
            return res.status(404).json({ error: "No results found" });
        }

        let movies = response.data.Search;

        if (!genre) {
            setCache(cacheKey, response.data, 60000);
            return res.json(response.data);
        }

        // Genre filtering — fetch details for each result
        const detailRequests = movies.map(movie =>
            axios.get(process.env.API_BASE, {
                params: { apikey: process.env.API_KEY, i: movie.imdbID }
            })
                .then(r => r.data)
                .catch(() => null)
        );

        const details = await Promise.all(detailRequests);

        const filtered = details.filter(m =>
            m &&
            m.Genre &&
            m.Genre.toLowerCase().includes(genre.toLowerCase())
        );

        const result = {
            ...response.data,
            Search: filtered,
            totalResults: filtered.length
        };

        setCache(cacheKey, result, 60000);
        return res.json(result);

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

    // 3 harf sınırı API'yi boşuna yormaz
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

    const cached = getCache(cacheKey);
    if (cached) {
        console.log("Top10 from cache");
        return res.json(cached);
    }

    try {

        const searchRes = await axios.get(process.env.API_BASE, {
            params: {
                apikey: API_KEY,
                s: "movie", // geniş sonuç verir
                type: "movie",
                page: 1
            }
        });

        if (!searchRes.data.Search) {
            return res.status(404).json({ error: "No data found" });
        }


        const detailRequests = searchRes.data.Search.map(movie =>
            axios.get(process.env.API_BASE, {
                params: {
                    apikey: API_KEY,
                    i: movie.imdbID
                }
            })
                .then(r => r.data)
                .catch(() => null)
        );

        const details = await Promise.all(detailRequests);

        // 3️⃣ Geçerli olanları al + rating'e göre sırala
        const sorted = details
            .filter(m => m && m.imdbRating && m.imdbRating !== "N/A")
            .sort((a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating))
            .slice(0, 10);


        setCache(cacheKey, sorted, 3600000); // 1 saat

        res.json(sorted);

    } catch (err) {
        console.error("Top10 error:", err.response?.data || err.message);
        res.status(500).json({ error: "Server error" });
    }
};

export const getTop10Series = async (req, res) => {
    const API_KEY = process.env.API_KEY;
    const cacheKey = "top10series";

    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    try {
        const searchRes = await axios.get(process.env.API_BASE, {
            params: {
                apikey: API_KEY,
                s: "series",
                type: "series",
                page: 1
            }
        });

        if (!searchRes.data.Search) {
            return res.status(404).json({ error: "No data found" });
        }

        const detailRequests = searchRes.data.Search.map(item =>
            axios.get(process.env.API_BASE, {
                params: { apikey: API_KEY, i: item.imdbID }
            }).then(r => r.data).catch(() => null)
        );

        const details = await Promise.all(detailRequests);

        const sorted = details
            .filter(m => m && m.imdbRating && m.imdbRating !== "N/A")
            .sort((a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating))
            .slice(0, 10);

        setCache(cacheKey, sorted, 3600000);
        res.json(sorted);

    } catch (err) {
        console.error("Top10Series error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
};