// api.js
// All backend communication lives here.
// script.js should never call fetch() directly — use these functions instead.

const BASE_URL = "https://omdb-project-j6ae.onrender.com";
// const BASE_URL = "http://localhost:5000";

// attaches the JWT token to requests that need auth
function authHeaders() {
    const token = localStorage.getItem("movieapp_token");
    return token
        ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        : { "Content-Type": "application/json" };
}

// generic helper — throws on non-ok so callers don't have to check res.ok every time
async function request(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}

// =====================
// MOVIES
// =====================

async function searchMovies({ title, type = "", year = "", page = 1 }) {
    const params = new URLSearchParams({ title, page });
    if (type) params.set("type", type);
    if (year) params.set("year", year);
    return request(`/movies?${params}`);
}

async function getMovieById(imdbID) {
    return request(`/movies?id=${imdbID}`);
}

// =====================
// AUTOCOMPLETE
// =====================

async function getAutocompleteSuggestions(query) {
    const params = new URLSearchParams({ q: query });
    return request(`/autocomplete?${params}`);
}

// =====================
// TOP 10
// =====================

async function getTop10() {
    return request("/top10");
}

// =====================
// AUTH
// =====================

async function loginUser(email, password) {
    return request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
}

async function registerUser(username, email, password) {
    return request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
    });
}

async function getCurrentUser() {
    return request("/auth/me", { headers: authHeaders() });
}

// =====================
// WATCHLIST
// =====================

async function fetchWatchlist() {
    return request("/watchlist", { headers: authHeaders() });
}

async function addToWatchlist(content) {
    return request("/watchlist", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            imdbID: content.imdbID,
            title: content.Title || content.title,
            poster: content.Poster || content.poster,
            year: content.Year || content.year,
            type: content.Type || content.type
        })
    });
}

async function removeFromWatchlist(imdbID) {
    return request(`/watchlist/${imdbID}`, {
        method: "DELETE",
        headers: authHeaders()
    });
}

// =====================
// WATCHED
// =====================

async function fetchWatched() {
    return request("/watched", { headers: authHeaders() });
}

async function markAsWatched(content) {
    return request("/watched", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            imdbID: content.imdbID,
            title: content.Title || content.title,
            poster: content.Poster || content.poster,
            year: content.Year || content.year,
            type: content.Type || content.type
        })
    });
}

async function removeFromWatched(imdbID) {
    return request(`/watched/${imdbID}`, {
        method: "DELETE",
        headers: authHeaders()
    });
}