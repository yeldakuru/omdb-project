const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());

const API_KEY = process.env.API_KEY;
const API_BASE = process.env.API_BASE;

// BASİT CACHING OBJESİ
const cache = {};

app.get("/movies", async (req, res) => {
    try {
        const { title, type, year, page } = req.query;

        if (!title) return res.status(400).json({ error: "Title is required" });

        // Cache anahtarı oluştur (Örn: "inception-movie-2010-1")
        const cacheKey = `${title}-${type || ''}-${year || ''}-${page || 1}`;

        // EĞER CACHE'DE VARSA, API'YE GİTMEDEN DÖN
        if (cache[cacheKey]) {
            console.log("Serving from cache:", cacheKey);
            return res.json(cache[cacheKey]);
        }

        const response = await axios.get(API_BASE, {
            params: {
                apikey: API_KEY,
                s: title, // 't' yerine 's' kullanarak tüm listeyi alıyoruz
                type: type,
                y: year,
                page: page || 1
            }
        });

        if (response.data.Response === "False") {
            return res.status(404).json({ error: response.data.Error });
        }

        // VERİYİ CACHE'E EKLE VE GÖNDER
        cache[cacheKey] = response.data;
        res.json(response.data);

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));