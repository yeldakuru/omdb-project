import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    watchlist: [
        {
            imdbID: String,
            title: String,
            poster: String,
            year: String,
            type: String,
            genre: String
        }
    ],

    watched: [
        {
            imdbID: String,
            title: String,
            poster: String,
            year: String,
            type: String,
            genre: String
        }]
}, { timestamps: true }); // createdAt ve updatedAt alanları otomatik olarak almak için

module.exports = mongoose.model("User", userSchema);