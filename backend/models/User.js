import mongoose from "mongoose";

const contentSchema = new mongoose.Schema({
    imdbID: { type: String, required: true },
    title: { type: String },
    poster: { type: String },
    year: { type: String },
    type: { type: String }
}, { _id: false }); // her item'a gereksiz _id üretmesin

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    watchlist: [contentSchema],
    watched: [contentSchema]
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;