// STATE

let currentPage = 1;
let totalResults = 0;
let currentUser = null;
let authToken = null;
let userWatchlist = [];
let userWatched = [];


// POPCORN INTRO

(function runIntro() {
    const canvas = document.getElementById("popcorn-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    });

    const kernelColors = [
        "#f9e4a0", "#f5d47a", "#ede0b0", "#faf0cc",
        "#f2c94c", "#fff9e0", "#e8d48a", "#fdf3c0", "#f7dc6f"
    ];

    let pieces = [];

    function drawKernel(x, y, radius, angle, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = color;
        ctx.beginPath();

        const numBumps = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numBumps; i++) {
            const a = (Math.PI * 2 / numBumps) * i;
            const r = radius * (i % 2 === 0 ? 1 : 0.65);
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            const cpx = Math.cos(a - 0.5) * r * 1.2;
            const cpy = Math.sin(a - 0.5) * r * 1.2;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.quadraticCurveTo(cpx, cpy, px, py);
        }

        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.beginPath();
        ctx.ellipse(0, radius * 0.85, radius * 0.65, radius * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function spawnKernels() {
        const bx = W / 2;
        const by = H / 2 - 30;
        const count = 1 + Math.floor(Math.random() * 3);

        for (let i = 0; i < count; i++) {
            pieces.push({
                x: bx + (Math.random() - 0.5) * 40,
                y: by - 10,
                vx: (Math.random() - 0.5) * 12,
                vy: -(Math.random() * 16 + 7),
                radius: 7 + Math.random() * 13,
                angle: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.25,
                color: kernelColors[Math.floor(Math.random() * kernelColors.length)],
                alpha: 1,
                settled: false
            });
        }
    }

    let startTime = null;
    let lastSpawnTime = 0;

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        ctx.clearRect(0, 0, W, H);

        if (elapsed < 1900 && timestamp - lastSpawnTime > 55) {
            spawnKernels();
            lastSpawnTime = timestamp;
        }

        pieces = pieces.filter(p => p.alpha > 0.005);

        for (const p of pieces) {
            if (!p.settled) {
                p.vy += 0.6;
                p.x += p.vx;
                p.y += p.vy;
                p.angle += p.spin;

                if (p.y + p.radius > H) {
                    p.y = H - p.radius;
                    p.vy *= -0.38;
                    p.vx *= 0.72;
                    p.spin *= 0.65;
                    if (Math.abs(p.vy) < 1.5) p.settled = true;
                }
            }

            if (elapsed > 2600) p.alpha = Math.max(0, p.alpha - 0.025);
            ctx.globalAlpha = p.alpha;
            drawKernel(p.x, p.y, p.radius, p.angle, p.color);
        }

        ctx.globalAlpha = 1;
        if (elapsed < 3500) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    setTimeout(() => {
        const screen = document.getElementById("intro-screen");
        if (!screen) return;
        screen.classList.add("hiding");
        screen.addEventListener("animationend", () => screen.remove(), { once: true });
    }, 3200);
})();


// UTILS

function esc(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function debounce(fn, wait = 400) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), wait);
    };
}


// YEAR DROPDOWN

(function buildYears() {
    const sel = document.getElementById("f-year");
    if (!sel) return;

    const thisYear = new Date().getFullYear();
    for (let y = thisYear; y >= 1900; y--) {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;
        sel.appendChild(opt);
    }
})();


// AUTH — STARTUP

function initAuth() {
    const savedToken = localStorage.getItem("contentapp_token");
    const savedUser = localStorage.getItem("contentapp_user");

    const tokenOk = savedToken && savedToken !== "undefined" && savedToken !== "null";
    const userOk = savedUser && savedUser !== "undefined" && savedUser !== "null";

    if (tokenOk && userOk) {
        try {
            const parsed = JSON.parse(savedUser);
            if (!parsed || typeof parsed !== "object" || !parsed.username) {
                throw new Error("bad user object");
            }
            authToken = savedToken;
            currentUser = parsed;
            updateHeaderUI();
            loadUserLists();
        } catch (e) {
            localStorage.removeItem("contentapp_token");
            localStorage.removeItem("contentapp_user");
            updateHeaderUI();
        }
    } else {
        localStorage.removeItem("contentapp_token");
        localStorage.removeItem("contentapp_user");
        updateHeaderUI();
    }
}

function updateHeaderUI() {
    const authBtn = document.getElementById("auth-btn");
    const userMenu = document.getElementById("user-menu");

    if (currentUser) {
        authBtn.style.display = "none";
        userMenu.style.display = "flex";
        document.getElementById("user-greeting").textContent = currentUser.username;
    } else {
        authBtn.style.display = "flex";
        userMenu.style.display = "none";
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    userWatchlist = [];
    userWatched = [];
    localStorage.removeItem("contentapp_token");
    localStorage.removeItem("contentapp_user");
    updateHeaderUI();
    closeUserDropdown();
    if (document.getElementById("modal-overlay").classList.contains("open")) closeModal();
}


// AUTH MODAL

let authMode = "login";

function openAuthModal(mode) {
    authMode = mode || "login";
    document.getElementById("auth-modal").classList.add("open");
    document.body.style.overflow = "hidden";
    renderAuthForm();
}

function closeAuthModal() {
    document.getElementById("auth-modal").classList.remove("open");
    document.body.style.overflow = "";
}

function switchAuthMode(mode) {
    authMode = mode;
    renderAuthForm();
}

function renderAuthForm() {
    const container = document.getElementById("auth-form-container");
    const isLogin = authMode === "login";

    container.innerHTML = `
        <h2 class="auth-title">${isLogin ? "Sign In" : "Create Account"}</h2>
        <div id="auth-error" class="auth-error" style="display:none"></div>

        ${!isLogin ? `
        <div class="auth-field">
            <label>Username</label>
            <input type="text" id="auth-username" placeholder="Choose a username" autocomplete="off" />
        </div>` : ""}

        <div class="auth-field">
            <label>Email</label>
            <input type="email" id="auth-email" placeholder="your@email.com" autocomplete="email" />
        </div>

        <div class="auth-field">
            <label>Password</label>
            <input type="password" id="auth-password"
                placeholder="${isLogin ? "Your password" : "At least 6 characters"}"
                autocomplete="${isLogin ? "current-password" : "new-password"}" />
        </div>

        <button class="auth-submit-btn" onclick="submitAuth()">
            ${isLogin ? "Sign In" : "Create Account"}
        </button>

        <p class="auth-switch">
            ${isLogin
            ? `Don't have an account? <button class="auth-link-btn" onclick="switchAuthMode('register')">Sign up</button>`
            : `Already have an account? <button class="auth-link-btn" onclick="switchAuthMode('login')">Sign in</button>`
        }
        </p>
    `;

    container.querySelectorAll("input").forEach(input => {
        input.addEventListener("keydown", e => { if (e.key === "Enter") submitAuth(); });
    });

    setTimeout(() => container.querySelector("input")?.focus(), 50);
}

async function submitAuth() {
    const email = document.getElementById("auth-email")?.value.trim();
    const password = document.getElementById("auth-password")?.value;
    const btn = document.querySelector(".auth-submit-btn");

    if (!email || !password) {
        showAuthError("Please fill in all fields.");
        return;
    }

    btn.disabled = true;
    btn.textContent = "Please wait...";
    document.getElementById("auth-error").style.display = "none";

    try {
        let tokenData;

        if (authMode === "login") {
            tokenData = await loginUser(email, password);
        } else {
            const username = document.getElementById("auth-username")?.value.trim();
            if (!username) {
                showAuthError("Username is required.");
                btn.disabled = false;
                btn.textContent = "Create Account";
                return;
            }
            tokenData = await registerUser(username, email, password);
        }

        authToken = tokenData.token;
        localStorage.setItem("contentapp_token", authToken);

        const user = await getCurrentUser();
        currentUser = user;
        localStorage.setItem("contentapp_user", JSON.stringify(currentUser));

        updateHeaderUI();
        loadUserLists();
        closeAuthModal();

    } catch (err) {
        showAuthError(err.message || "Something went wrong.");
        btn.disabled = false;
        btn.textContent = authMode === "login" ? "Sign In" : "Create Account";
    }
}

function showAuthError(msg) {
    const el = document.getElementById("auth-error");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
}


// USER DROPDOWN

function toggleUserDropdown() {
    document.getElementById("user-dropdown").classList.toggle("open");
}

function closeUserDropdown() {
    document.getElementById("user-dropdown").classList.remove("open");
}

document.addEventListener("click", e => {
    const menu = document.getElementById("user-menu");
    if (menu && !menu.contains(e.target)) closeUserDropdown();
});


// USER LISTS — DATA

async function loadUserLists() {
    if (!authToken) return;

    try {
        const [watchlist, watched] = await Promise.all([
            fetchWatchlist(),
            fetchWatched()
        ]);
        userWatchlist = watchlist;
        userWatched = watched;
    } catch (err) {
        console.error("Could not load user lists:", err.message);
    }
}

function isInWatchlist(imdbID) {
    return userWatchlist.some(m => m.imdbID === imdbID);
}

function isWatched(imdbID) {
    return userWatched.some(m => m.imdbID === imdbID);
}

async function toggleWatchlist(imdbID) {
    if (!currentUser) { openAuthModal("login"); return; }

    // currentModalcontent'i buradan okumak yerine imdbID üzerinden çalışıyoruz
    const content = currentModalContent;
    if (!content) return;

    try {
        if (isInWatchlist(imdbID)) {
            await removeFromWatchlist(imdbID);
            userWatchlist = userWatchlist.filter(m => m.imdbID !== imdbID);
        } else {
            const updated = await addToWatchlist(content);
            userWatchlist = Array.isArray(updated) ? updated : (updated.watchlist || userWatchlist);
        }
        refreshModalButtons(imdbID);
    } catch (err) {
        console.error("Watchlist error:", err.message);
    }
}

async function toggleWatched(imdbID) {
    if (!currentUser) { openAuthModal("login"); return; }

    const content = currentModalContent;
    if (!content) return;

    try {
        if (isWatched(imdbID)) {
            await removeFromWatched(imdbID);
            userWatched = userWatched.filter(m => m.imdbID !== imdbID);
        } else {
            const updated = await markAsWatched(content);
            userWatched = Array.isArray(updated) ? updated : (updated.watched || userWatched);

            userWatchlist = userWatchlist.filter(m => m.imdbID !== imdbID);
        }
        refreshModalButtons(imdbID);
    } catch (err) {
        console.error("Watched error:", err.message);
    }
}

function refreshModalButtons(imdbID) {
    const wlBtn = document.getElementById("modal-watchlist-btn");
    const wdBtn = document.getElementById("modal-watched-btn");
    if (!wlBtn || !wdBtn) return;

    const inWL = isInWatchlist(imdbID);
    const inWD = isWatched(imdbID);

    wlBtn.classList.toggle("active", inWL);
    wlBtn.textContent = inWL ? "✓ In Watchlist" : "+ Watchlist";

    wdBtn.classList.toggle("active", inWD);
    wdBtn.textContent = inWD ? "✓ Watched" : "Mark as Watched";
}


// MY LISTS MODAL

let activeListTab = "watchlist";

function openMyLists() {
    closeUserDropdown();
    document.getElementById("lists-modal").classList.add("open");
    document.body.style.overflow = "hidden";
    renderMyLists("watchlist");
}

function closeMyLists() {
    document.getElementById("lists-modal").classList.remove("open");
    document.body.style.overflow = "";
}

function renderMyLists(tab) {
    activeListTab = tab;
    const items = tab === "watchlist" ? userWatchlist : userWatched;

    document.querySelectorAll(".list-tab").forEach(t => {
        t.classList.toggle("active", t.dataset.tab === tab);
    });

    const container = document.getElementById("lists-content");

    if (items.length === 0) {
        container.innerHTML = `
            <div class="lists-empty">
                <span>${tab === "watchlist" ? "📋" : "✅"}</span>
                <p>${tab === "watchlist" ? "Your watchlist is empty." : "No watched contents yet."}</p>
                <p class="lists-empty-sub">Search for a content and add it from the detail view.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="lists-grid">
            ${items.map(content => `
                <div class="list-card" onclick="openModal('${content.imdbID}')">
                    <div class="list-card-poster">
                        ${content.poster && content.poster !== "N/A"
            ? `<img src="${esc(content.poster)}" alt="${esc(content.title)}" loading="lazy"
                                onerror="this.parentElement.innerHTML = posterFallbackHTML()">`
            : posterFallbackHTML()
        }
                    </div>
                    <div class="list-card-info">
                        <div class="list-card-title">${esc(content.title)}</div>
                        <div class="list-card-year">${content.year || "—"}</div>
                    </div>
                    <button class="list-card-remove"
                        onclick="removeListItem(event, '${content.imdbID}', '${tab}')">✕</button>
                </div>
            `).join("")}
        </div>
    `;
}

async function removeListItem(e, imdbID, list) {
    e.stopPropagation();

    try {
        if (list === "watchlist") {
            await removeFromWatchlist(imdbID);
            userWatchlist = userWatchlist.filter(m => m.imdbID !== imdbID);
        } else {
            await removeFromWatched(imdbID);
            userWatched = userWatched.filter(m => m.imdbID !== imdbID);
        }
        renderMyLists(activeListTab);
    } catch (err) {
        console.error("Remove error:", err.message);
    }
}


// TOP 10 GRID

let top10contents = [];

async function loadTop10() {
    try {
        const contents = await getTop10();
        if (!Array.isArray(contents)) return;
        top10contents = contents;
        renderTop10Grid(contents, "top10-grid");
        loadTopSeries();
    } catch (err) {
        console.error(err);
    }
}

async function loadTopSeries() {
    try {
        const contents = await getTop10Series();
        if (!Array.isArray(contents) || contents.length === 0) return;
        renderTop10Grid(contents, "top-series-grid");
        document.getElementById("top-series-label").style.display = "block";
    } catch (err) {
        console.error("Top series error:", err);
    }
}

function renderTop10Grid(contents, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    grid.innerHTML = contents.slice(0, 10).map((c, i) => {
        const poster = c.Poster || c.poster;
        const hasPoster = poster && poster !== "N/A";
        const id = c.imdbID || c.imdbId;
        return `
            <div class="top-card" onclick="openModal('${id}')">
                <div class="rank">#${i + 1}</div>
                ${hasPoster
                ? `<img src="${esc(poster)}" alt="${esc(c.Title || c.title || '')}" loading="lazy"
                        onerror="this.style.display='none'; this.parentElement.classList.add('no-poster')">`
                : `<div class="top-card-fallback">${posterFallbackHTML()}</div>`
            }
            </div>
        `;
    }).join("");
}


// AUTOCOMPLETE

let autocompleteCache = {};
let currentSuggestions = [];
let selectedSuggestionIndex = -1;

const debouncedAutocomplete = debounce(fetchSuggestions, 350);

function onSearchInput() {
    const q = document.getElementById("q").value.trim();
    if (q.length < 2) { hideSuggestions(); return; }
    debouncedAutocomplete(q);
}

async function fetchSuggestions(query) {
    if (autocompleteCache[query]) {
        showSuggestions(autocompleteCache[query]);
        return;
    }

    try {
        const data = await getAutocompleteSuggestions(query);
        const suggestions = Array.isArray(data) ? data : (data.suggestions || []);
        autocompleteCache[query] = suggestions;
        showSuggestions(suggestions);
    } catch {
        hideSuggestions();
    }
}

function showSuggestions(suggestions) {
    const dropdown = document.getElementById("autocomplete-dropdown");
    if (!dropdown || suggestions.length === 0) { hideSuggestions(); return; }

    currentSuggestions = suggestions;
    selectedSuggestionIndex = -1;

    dropdown.innerHTML = suggestions.map((s, i) => `
        <div class="suggestion-item" data-index="${i}" onclick="selectSuggestion(${i})">
            ${s.poster && s.poster !== "N/A"
            ? `<img class="suggestion-poster" src="${s.poster}" alt="" loading="lazy">`
            : `<div class="suggestion-poster suggestion-poster-empty"></div>`
        }
            <div class="suggestion-info">
                <div class="suggestion-title">${esc(s.title)}</div>
                <div class="suggestion-meta">${s.year || ""} · ${s.type || ""}</div>
            </div>
        </div>
    `).join("");

    dropdown.style.display = "block";
}

function hideSuggestions() {
    const dropdown = document.getElementById("autocomplete-dropdown");
    if (dropdown) dropdown.style.display = "none";
    currentSuggestions = [];
    selectedSuggestionIndex = -1;
}

function selectSuggestion(index) {
    const s = currentSuggestions[index];
    if (!s) return;
    document.getElementById("q").value = s.title;
    hideSuggestions();
    // BUG FIX: önce search yap (arka planda sonuçlar görünsün), sonra modal aç
    doSearch(1);
    openModal(s.imdbID);
}

function updateSuggestionHighlight() {
    document.querySelectorAll(".suggestion-item").forEach((el, i) => {
        el.classList.toggle("highlighted", i === selectedSuggestionIndex);
    });
}

document.getElementById("q").addEventListener("keydown", e => {
    const dropdown = document.getElementById("autocomplete-dropdown");
    const isVisible = dropdown && dropdown.style.display === "block";

    if (e.key === "ArrowDown" && isVisible) {
        e.preventDefault();
        selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, currentSuggestions.length - 1);
        updateSuggestionHighlight();
    } else if (e.key === "ArrowUp" && isVisible) {
        e.preventDefault();
        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
        updateSuggestionHighlight();
    } else if (e.key === "Enter") {
        if (isVisible && selectedSuggestionIndex >= 0) {
            e.preventDefault();
            selectSuggestion(selectedSuggestionIndex);
        } else {
            hideSuggestions();
            doSearch(1);
        }
    } else if (e.key === "Escape") {
        hideSuggestions();
    }
});

document.addEventListener("click", e => {
    const wrap = document.querySelector(".search-wrap");
    if (wrap && !wrap.contains(e.target)) hideSuggestions();
});


// SEARCH

document.getElementById("f-type").addEventListener("change", () => doSearch(1));
document.getElementById("f-year").addEventListener("change", () => doSearch(1));
document.getElementById("f-genre").addEventListener("change", () => doSearch(1));

function doSearch(page = 1) {
    const q = document.getElementById("q").value.trim();
    const type = document.getElementById("f-type").value;
    const year = document.getElementById("f-year").value;
    const genre = document.getElementById("f-genre")?.value;

    // Arama çubuğu boş olsa bile type veya genre seçilmişse arama yap
    const searchQuery = q || type || genre || year;
    if (!searchQuery) return;

    // Sorgu yoksa ama filtre varsa varsayılan geniş terim kullan
    const effectiveQuery = q || (type === "series" ? "the" : "movie");

    loadSearchResults(effectiveQuery, type, year, page, genre, q);
}

async function loadSearchResults(q, type, year, page, genre, displayQuery) {
    showLoading();

    try {
        const data = await searchcontents({ title: q, type, year, page, genre });

        if (data.Response === "True") {
            totalResults = data.totalResults;
            renderGrid(data.Search, displayQuery || q, page);
        } else {
            const queryText = displayQuery || q;
            const filterText = [
                type ? `type: <strong>${type}</strong>` : "",
                genre ? `genre: <strong>${genre}</strong>` : "",
                year ? `year: <strong>${year}</strong>` : ""
            ].filter(Boolean).join(", ");

            showState("not-found", "🎬",
                "Content Not Found",
                queryText
                    ? `"<strong>${esc(queryText)}</strong>" yielded no results.${filterText ? ` Filters: ${filterText}` : ""} Try a different search.`
                    : `No results found for the selected filters (${filterText}). Try changing your filters.`
            );
        }
    } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
            showState("error", "🔒", "Session Expired", "Please sign in again to continue.");
        } else if (status === 429) {
            showState("error", "⏳", "Too Many Requests", "You've made too many requests. Wait a moment and try again.");
        } else if (!navigator.onLine) {
            showState("error", "📡", "No Internet Connection", "Check your network connection and try again.");
        } else if (err?.message?.toLowerCase().includes("no results") || err?.message?.toLowerCase().includes("not found")) {
            showState("not-found", "🎬", "No Results Found",
                `We couldn't find anything matching your search. Try different keywords or remove some filters.`);
        } else {
            showState("not-found", "🎬", "No Results Found",
                `We couldn't find what you were looking for. Try a different title, keyword, or adjust your filters.`);
        }
    }
}

// GRID

function renderGrid(contents, query, page) {
    const section = document.getElementById("results-section");
    const grid = document.getElementById("grid");
    const top10 = document.getElementById("top10-section");

    section.hidden = false;
    document.getElementById("hero").classList.add("compact");
    document.getElementById("state-area").innerHTML = "";
    if (top10) top10.style.display = "none";

    document.getElementById("results-title").textContent = `"${query}"`;
    document.getElementById("results-count").textContent =
        `${totalResults.toLocaleString()} result${totalResults !== 1 ? "s" : ""} — page ${page}`;

    grid.innerHTML = "";
    contents.forEach((m, i) => {
        const card = document.createElement("div");
        card.className = "card";
        card.dataset.type = m.Type || "content";
        card.style.animationDelay = `${i * 40}ms`;
        card.onclick = () => openModal(m.imdbID);

        const hasPoster = m.Poster && m.Poster !== "N/A";
        const inWL = isInWatchlist(m.imdbID);
        card.innerHTML = `
            <div class="card-poster-wrap">
                ${hasPoster
                ? `<img class="card-poster" src="${m.Poster}" alt="${esc(m.Title)}"
                    loading="lazy" onerror="this.replaceWith(posterFallback())">`
                : posterFallbackHTML()
            }
                <button class="card-wl-btn ${inWL ? "active" : ""}"
                    title="${inWL ? "Watchlist'ten çıkar" : "Watchlist'e ekle"}"
                    data-imdbid="${m.imdbID}">
                    ${inWL ? "✓" : "+"}
                </button>
            </div>
            <div class="card-body">
                <div class="card-year">
                    ${m.Year || "—"} • ${m.Genre ? m.Genre.split(",")[0] : ""}
                </div>
                <div class="card-title">${esc(m.Title)}</div>
            </div>
        `;

        card.querySelector(".card-wl-btn").addEventListener("click", async (e) => {
            e.stopPropagation();
            if (!currentUser) { openAuthModal("login"); return; }
            const btn = e.currentTarget;
            const id = btn.dataset.imdbid;
            const tempContent = { imdbID: id, Title: m.Title, Poster: m.Poster, Year: m.Year, Type: m.Type };
            currentModalContent = tempContent;
            await toggleWatchlist(id);
            const nowIn = isInWatchlist(id);
            btn.textContent = nowIn ? "✓" : "+";
            btn.classList.toggle("active", nowIn);
            btn.title = nowIn ? "Watchlist'ten çıkar" : "Watchlist'e ekle";
            currentModalContent = null;
        });

        grid.appendChild(card);
    });

    renderPagination(page);
    if (page === 1) section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function posterFallbackHTML() {
    return `
        <div class="card-poster-fallback">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <rect x="2" y="2" width="20" height="20" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>No Poster</span>
        </div>
    `;
}

function posterFallback() {
    const div = document.createElement("div");
    div.innerHTML = posterFallbackHTML();
    return div.firstElementChild;
}


// PAGINATION

function renderPagination(page) {
    const totalPages = Math.ceil(totalResults / 10);
    const pg = document.getElementById("pagination");

    if (totalPages <= 1) { pg.innerHTML = ""; return; }

    pg.innerHTML = `
        <button class="pg-btn" onclick="doSearch(${page - 1})" ${page <= 1 ? "disabled" : ""}>← PREV</button>
        <span class="pg-info">${page} / ${totalPages}</span>
        <button class="pg-btn" onclick="doSearch(${page + 1})" ${page >= totalPages ? "disabled" : ""}>NEXT →</button>
    `;
}


// LOADING / ERROR STATES

function showLoading() {
    const top10 = document.getElementById("top10-section");
    if (top10) top10.style.display = "none";
    document.getElementById("hero").classList.add("compact");
    document.getElementById("results-section").hidden = true;
    document.getElementById("state-area").innerHTML = `
        <div class="state-loading">
            <div class="loader"><span></span><span></span><span></span></div>
            <p class="state-sub">Archives are being scanned…</p>
        </div>
    `;
}

function showState(type, icon, title, sub) {
    const top10 = document.getElementById("top10-section");
    if (top10) top10.style.display = "none";
    document.getElementById("hero").classList.add("compact");
    document.getElementById("results-section").hidden = true;
    document.getElementById("state-area").innerHTML = `
        <div class="state-box state-${type}">
            <span class="state-icon">${icon}</span>
            <div class="state-title">${title}</div>
            <p class="state-sub">${sub}</p>
            <button class="state-retry-btn" onclick="document.getElementById('q').focus(); resetStateArea()">
                Make New Search
            </button>
        </div>
    `;
}

function resetStateArea() {
    document.getElementById("state-area").innerHTML = "";
}


// MOVIE DETAIL MODAL

let currentModalContent = null;

async function openModal(imdbID) {
    const overlay = document.getElementById("modal-overlay");
    const inner = document.getElementById("modal-inner");

    overlay.classList.add("open");
    document.body.style.overflow = "hidden";

    inner.innerHTML = `
        <div style="padding:60px;text-align:center;width:100%">
            <div class="loader"><span></span><span></span><span></span></div>
        </div>
    `;

    try {
        const content = await getcontentById(imdbID);
        currentModalContent = content;

        const hasPoster = content.Poster && content.Poster !== "N/A";
        const inWL = isInWatchlist(imdbID);
        const inWD = isWatched(imdbID);

        const ratingsHTML = (content.Ratings || []).map(r => `
            <div class="rating-box">
                <span class="rating-source">${r.Source}</span>
                <span class="rating-val">${r.Value}</span>
            </div>
        `).join("");

        inner.innerHTML = `
            <div class="modal-poster-col">
                ${hasPoster
                ? `<img class="modal-poster" src="${content.Poster}" alt="${esc(content.Title)}">`
                : posterFallbackHTML()
            }
            </div>
            <div class="modal-content">
                <div class="modal-meta-top">
                    <span class="pill accent">${content.Year || ""}</span>
                    <span class="pill">${content.Runtime && content.Runtime !== "N/A" ? content.Runtime : ""}</span>
                    <span class="pill">${content.Type || ""}</span>
                </div>
                <h2 class="modal-title">${esc(content.Title)}</h2>
                <p class="modal-plot">${esc(content.Plot || "")}</p>
                <div class="detail-grid">
                    ${detailItem("Director", content.Director)}
                    ${detailItem("Cast", content.Actors)}
                    ${detailItem("Genre", content.Genre)}
                    ${detailItem("Country", content.Country)}
                    ${detailItem("Awards", content.Awards)}
                </div>
                <div class="ratings-row">${ratingsHTML}</div>
                <div class="modal-actions">
                    <button id="modal-watchlist-btn" class="action-btn ${inWL ? "active" : ""}">
                        ${inWL ? "✓ In Watchlist" : "+ Watchlist"}
                    </button>
                    <button id="modal-watched-btn" class="action-btn ${inWD ? "active" : ""}">
                        ${inWD ? "✓ Watched" : "Mark as Watched"}
                    </button>
                </div>
            </div>
        `;

        // BUG FIX: bind buttons via JS event listeners so they can access currentModalContent
        document.getElementById("modal-watchlist-btn").addEventListener("click", () => toggleWatchlist(imdbID));
        document.getElementById("modal-watched-btn").addEventListener("click", () => toggleWatched(imdbID));

    } catch (err) {
        inner.innerHTML = `<p style="padding:40px;color:var(--muted)">Error loading details.</p>`;
        console.error("Modal error:", err.message);
    }
}

function detailItem(label, val) {
    if (!val || val === "N/A") return "";
    return `
        <div class="detail-item">
            <div class="detail-label">${label}</div>
            <div class="detail-value">${esc(val)}</div>
        </div>
    `;
}

function closeModal() {
    document.getElementById("modal-overlay").classList.remove("open");
    document.body.style.overflow = "";
    currentModalContent = null;
}

document.getElementById("modal-overlay").addEventListener("click", e => {
    if (e.target.id === "modal-overlay") closeModal();
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        closeModal();
        closeMyLists();
        closeAuthModal();
    }
});


// RESET & RESTORE

function resetToHome() {
    document.getElementById("results-section").hidden = true;
    document.getElementById("state-area").innerHTML = "";
    document.getElementById("hero").classList.remove("compact");
    document.getElementById("q").value = "";
    hideSuggestions();
    history.replaceState(null, "", location.pathname);

    const top10 = document.getElementById("top10-section");
    if (top10) top10.style.display = "block";
}

(function restoreFromURL() {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (!q) return;

    document.getElementById("q").value = q;
    document.getElementById("f-type").value = params.get("type") || "";
    document.getElementById("f-year").value = params.get("year") || "";
    doSearch(parseInt(params.get("page"), 10) || 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
})();


// INIT

initAuth();
loadTop10();