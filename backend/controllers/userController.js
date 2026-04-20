import User from "../models/User.js";

export const getWatchlist = async (req, res) => {
    const user = await User.findById(req.userId);
    res.json(user.watchlist);
};

export const addToWatchlist = async (req, res) => {
    const user = await User.findById(req.userId);

    user.watchlist.push(req.body);
    await user.save();

    res.json(user.watchlist);
};