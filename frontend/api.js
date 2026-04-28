
const api = axios.create({
    baseURL: "https://omdb-project-j6ae.onrender.com/api",

    headers: { "Content-Type": "application/json" }
});


api.interceptors.request.use((config) => {
    const token = localStorage.getItem("contentapp_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});


async function handleResponse(promise) {
    try {
        const res = await promise;
        return res.data;
    } catch (err) {
        const msg = err.response?.data?.error
            || err.response?.data?.message
            || err.message
            || "Server error";
        throw new Error(msg);
    }
}


async function searchcontents({ title, type = "", year = "", page = 1, genre = "" }) {
    return handleResponse(
        api.get("/content/", { params: { title, type, year, page, genre } })
    );
}

async function getcontentById(imdbID) {
    return handleResponse(
        api.get(`/content/${imdbID}`)
    );
}

async function getAutocompleteSuggestions(query) {
    return handleResponse(
        api.get("/content/autocomplete", { params: { q: query } })
    );
}

async function getTop10() {
    return handleResponse(
        api.get("/content/top10")
    );
}

// AUTH

async function loginUser(email, password) {
    const data = await handleResponse(
        api.post("/auth/login", { email, password })
    );
    // user bilgisini /auth/me'den 
    return data;
}

async function registerUser(username, email, password) {
    const data = await handleResponse(
        api.post("/auth/register", { username, email, password })
    );
    return data;
}

async function getCurrentUser() {
    return handleResponse(api.get("/auth/me"));
}


async function fetchWatchlist() {
    return handleResponse(api.get("/user/watchlist"));
}
async function addToWatchlist(content) {
    return handleResponse(api.post("/user/watchlist", {
        imdbID: content.imdbID || content.imdbId,
        title: content.Title || content.title,
        poster: content.Poster || content.poster,
        year: content.Year || content.year,
        type: content.Type || content.type
    }));
}

async function removeFromWatchlist(imdbID) {
    return handleResponse(api.delete(`/user/watchlist/${imdbID}`));
}


async function fetchWatched() {
    return handleResponse(api.get("/user/watched"));
}

async function markAsWatched(content) {
    return handleResponse(api.post("/user/watched", {
        imdbID: content.imdbID || content.imdbId,
        title: content.Title || content.title,
        poster: content.Poster || content.poster,
        year: content.Year || content.year,
        type: content.Type || content.type
    }));
}

async function removeFromWatched(imdbID) {
    return handleResponse(api.delete(`/user/watched/${imdbID}`));
}