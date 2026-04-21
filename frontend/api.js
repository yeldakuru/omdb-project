
const BASE_URL = "https://omdb-project-j6ae.onrender.com/api";

function authHeaders() {
    const token = localStorage.getItem("movieapp_token");
    return token
        ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        : { "Content-Type": "application/json" };
}

async function request(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, options);


    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Sunucudan beklenen JSON yanıtı gelmedi. (Rota hatası olabilir)");
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "İşlem başarısız oldu");
    return data;
}


async function searchMovies({ title, type = "", year = "", page = 1 }) {
    const params = new URLSearchParams({ title, page });
    if (type) params.set("type", type);
    if (year) params.set("year", year);

    return request(`/content/?${params}`);
}

async function getMovieById(imdbID) {

    return request(`/content/${imdbID}`);
}

async function getAutocompleteSuggestions(query) {
    const params = new URLSearchParams({ q: query });
    return request(`/content/autocomplete?${params}`);
}

async function getTop10() {

    return request("/content/getTop10");
}


// AUTH

async function loginUser(email, password) {
    return request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });
}

async function registerUser(username, email, password) {
    return request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password })
    });
}

async function getCurrentUser() {
    return request("/auth/me", { headers: authHeaders() });
}



async function fetchWatchlist() {
    return request("/user/watchlist", { headers: authHeaders() });
}

async function addToWatchlist(content) {
    return request("/user/watchlist", {
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
    return request(`/user/watchlist/${imdbID}`, {
        method: "DELETE",
        headers: authHeaders()
    });
}

async function fetchWatched() {
    return request("/user/watched", { headers: authHeaders() });
}

async function markAsWatched(content) {
    return request("/user/watched", {
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
    return request(`/user/watched/${imdbID}`, {
        method: "DELETE",
        headers: authHeaders()
    });
}