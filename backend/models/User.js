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
            type: String

        }
    ],

    watched: [
        {
            imdbID: String,
            title: String,
            poster: String,
            year: String,
            type: String

        }]
}, { timestamps: true }); // createdAt ve updatedAt alanları otomatik olarak almak için

const User = mongoose.model("User", userSchema);
export default User;
