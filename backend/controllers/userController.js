import User from "../models/User.js";

export const getWatchlist = async (req, res) => {
    const user = await User.findById(req.userId);
    res.json(user.watchlist);
};

export const addToWatchlist = async (req, res) => {
    const user = await User.findById(req.userId);
    const isExist = user.watchlist.find(content => content.imdbID === req.body.imdbID);
    if (isExist) {
        return res.status(400).json({ message: "Content already in watchlist" });
    }

    user.watchlist.push(req.body);
    await user.save();

    res.json(user.watchlist);
};

export const removeFromWatchlist = async (req, res) => {
    const user = await User.findById(req.userId);
    // $pull mantığıyla diziden filmi çıkarıyoruz
    user.watchlist = user.watchlist.filter(content => content.imdbID !== req.params.id);
    await user.save();
    res.json({ message: "Content removed from watchlist.", watchlist: user.watchlist });
};

export const getWatched = async (req, res) => {
    const user = await User.findById(req.userId);
    res.json(user.watched);
};

export const addToWatched = async (req, res) => {
    const user = await User.findById(req.userId);

    // Eğer film Watchlist'teyse sil
    user.watchlist = user.watchlist.filter(content => content.imdbID !== req.body.imdbID);

    user.watched.push(req.body);
    await user.save();
    res.json(user.watched);
};

export const removeFromWatched = async (req, res) => {
    const user = await User.findById(req.userId);
    user.watched = user.watched.filter(content => content.imdbID !== req.params.id);
    await user.save();
    res.json({ message: "Content removed from watched list.", watched: user.watched });
};