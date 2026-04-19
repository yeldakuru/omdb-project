const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());

// BASİT CACHING OBJESİ
const cache = {};

// Root path 
app.get('/', (req, res) => {
    res.send("Movie API is running!");
});

app.get('/movies', async (req, res) => {
    const { title, type, year, page, id } = req.query;
    const API_KEY = process.env.API_KEY;

    // Cache Key oluşturma (Aynı aramayı tekrar yapmamak için)
    const cacheKey = id || `${title}-${type}-${year}-${page}`;

    // 1. Önce Cache'e Bak: Eğer bu arama daha önce yapıldıysa direkt oradan dön
    if (cache[cacheKey]) {
        console.log("Serving from cache:", cacheKey);
        return res.json(cache[cacheKey]);
    }

    let url = `http://www.omdbapi.com/?apikey=${API_KEY}`;

    if (id) {
        url += `&i=${id}&plot=full`;
    } else {
        if (title) url += `&s=${encodeURIComponent(title)}`;
        if (type) url += `&type=${type}`;
        if (year) url += `&y=${year}`;
        if (page) url += `&page=${page}`;
    }

    try {
        console.log("Fetching from OMDB:", url);
        const response = await axios.get(url);

        // 2. Cache'e Kaydet: Gelen veriyi hafızaya al
        if (response.data.Response === "True") {
            cache[cacheKey] = response.data;
        }

        res.json(response.data);
    } catch (error) {
        console.error("Error details:", error.message);
        res.status(500).json({ error: "Server error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));