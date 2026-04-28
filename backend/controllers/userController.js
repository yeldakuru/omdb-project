import User from "../models/User.js";

export const getWatchlist = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user.watchlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const addToWatchlist = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const { imdbID, title, poster, year, type } = req.body;

        if (!imdbID) return res.status(400).json({ error: "imdbID is required" });

        const isExist = user.watchlist.find(c => c.imdbID === imdbID);
        if (isExist) return res.status(400).json({ message: "Already in watchlist" });

        user.watchlist.push({ imdbID, title, poster, year, type });
        await user.save();
        res.json(user.watchlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const removeFromWatchlist = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        user.watchlist = user.watchlist.filter(c => c.imdbID !== req.params.id);
        await user.save();
        res.json({ message: "Removed from watchlist.", watchlist: user.watchlist });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getWatched = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user.watched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const addToWatched = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const { imdbID, title, poster, year, type } = req.body;

        if (!imdbID) return res.status(400).json({ error: "imdbID is required" });

        // Duplicate kontrolü — bu eksikti, 500'e yol açıyordu
        const isExist = user.watched.find(c => c.imdbID === imdbID);
        if (isExist) return res.status(400).json({ message: "Already in watched list" });

        user.watchlist = user.watchlist.filter(c => c.imdbID !== imdbID);
        user.watched.push({ imdbID, title, poster, year, type });
        await user.save();
        res.json(user.watched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const removeFromWatched = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        user.watched = user.watched.filter(c => c.imdbID !== req.params.id);
        await user.save();
        res.json({ message: "Removed from watched list.", watched: user.watched });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};