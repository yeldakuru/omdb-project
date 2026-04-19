
let currentPage = 1;
let totalResults = 0;
let lastQuery = { q: '', type: '', year: '' };


// POPCORN INTRO ANIMATION

(function runIntro() {
    const canvas = document.getElementById('popcorn-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    });

    const kernelColors = ['#f9e4a0', '#f5d47a', '#ede0b0', '#faf0cc', '#f2c94c', '#fff9e0', '#e8d48a', '#fdf3c0', '#f7dc6f'];
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
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
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
        const screen = document.getElementById('intro-screen');
        if (screen) {
            screen.classList.add('hiding');
            screen.addEventListener('animationend', () => screen.remove(), { once: true });
        }
    }, 3200);
})();

// UTILS 
function esc(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function debounce(func, timeout = 600) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

// YEAR FILTER BUILDER
(function buildYears() {
    const sel = document.getElementById('f-year');
    if (!sel) return;
    const now = new Date().getFullYear();
    for (let y = now; y >= 1888; y--) {
        const o = document.createElement('option');
        o.value = y; o.textContent = y;
        sel.appendChild(o);
    }
})();

// SEARCH LOGIC 
function doSearch(page = 1) {
    const q = document.getElementById('q').value.trim();
    const type = document.getElementById('f-type').value;
    const year = document.getElementById('f-year').value;

    if (!q) {
        if (page === 1) resetToHome();
        return;
    }

    currentPage = page;
    lastQuery = { q, type, year };


    const params = new URLSearchParams({ q, page: currentPage });
    if (type) params.set('type', type);
    if (year) params.set('year', year);
    history.replaceState(null, '', '?' + params.toString());

    fetchResults(q, type, year, page);
}

// Debounced Search for Input
const processChange = debounce(() => doSearch(1));
document.getElementById('q').addEventListener('input', processChange);

// Instant Search for Filters
document.getElementById('f-type').addEventListener('change', () => doSearch(1));
document.getElementById('f-year').addEventListener('change', () => doSearch(1));

async function fetchResults(q, type, year, page) {
    showLoading();

    // Render Backend URL (Caching ve /movies endpoint)
    const BACKEND_URL = "https://omdb-project-j6ae.onrender.com/movies";
    //const BACKEND_URL http://localhost:5000/movies;

    try {
        const res = await fetch(`${BACKEND_URL}?title=${encodeURIComponent(q)}&type=${type}&year=${year}&page=${page}`);
        const data = await res.json();

        if (res.ok && data.Response === "True") {
            totalResults = parseInt(data.totalResults, 10);
            renderGrid(data.Search, q, page);
        } else {
            showState('error', '🎥', 'No results found', data.error || 'Try another title.');
        }
    } catch (e) {
        showState('error', '⚠️', 'Connection Error', 'Backend is waking up, please wait a moment...');
    }
}

//RENDER GRID 
function renderGrid(movies, query, page) {
    const section = document.getElementById('results-section');
    const grid = document.getElementById('grid');
    const rTitle = document.getElementById('results-title');
    const rCount = document.getElementById('results-count');
    const hero = document.getElementById('hero');

    section.hidden = false;
    hero.classList.add('compact');
    document.getElementById('state-area').innerHTML = '';

    rTitle.textContent = `"${query}"`;
    rCount.textContent = `${totalResults.toLocaleString()} result${totalResults !== 1 ? 's' : ''} — page ${page}`;

    grid.innerHTML = '';
    movies.forEach((m, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.animationDelay = `${i * 40}ms`;
        card.onclick = () => openModal(m.imdbID);

        const hasPoster = m.Poster && m.Poster !== 'N/A';
        card.innerHTML = `
            ${hasPoster
                ? `<img class="card-poster" src="${m.Poster}" alt="${esc(m.Title)}" loading="lazy" onerror="this.replaceWith(posterFallback())">`
                : posterFallbackHTML()
            }
            <div class="card-body">
                <div class="card-year">${m.Year || '—'}</div>
                <div class="card-title">${esc(m.Title)}</div>
            </div>
        `;
        grid.appendChild(card);
    });

    renderPagination(page);
    if (page === 1) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function posterFallbackHTML() {
    return `<div class="card-poster-fallback">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <span>No Poster</span>
    </div>`;
}

function posterFallback() {
    const div = document.createElement('div');
    div.innerHTML = posterFallbackHTML();
    return div.firstElementChild;
}

//PAGINATION
function renderPagination(page) {
    const totalPages = Math.ceil(totalResults / 10);
    const pg = document.getElementById('pagination');
    if (totalPages <= 1) { pg.innerHTML = ''; return; }

    pg.innerHTML = `
      <button class="pg-btn" onclick="doSearch(${page - 1})" ${page <= 1 ? 'disabled' : ''}>← PREV</button>
      <span class="pg-info">${page} / ${totalPages}</span>
      <button class="pg-btn" onclick="doSearch(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>NEXT →</button>
    `;
}

//UI STATES 
function showLoading() {
    document.getElementById('results-section').hidden = true;
    document.getElementById('state-area').innerHTML = `
      <div class="loader"><span></span><span></span><span></span></div>
      <p class="state-sub">Searching the archives…</p>
    `;
}

function showState(type, icon, title, sub) {
    document.getElementById('results-section').hidden = true;
    document.getElementById('state-area').innerHTML = `
      <div class="state-${type}">
        <span class="state-icon">${icon}</span>
        <div class="state-title">${title}</div>
        <p class="state-sub">${sub}</p>
      </div>
    `;
}

// MODAL 
async function openModal(imdbID) {
    const overlay = document.getElementById('modal-overlay');
    const inner = document.getElementById('modal-inner');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    inner.innerHTML = `<div style="padding:60px;text-align:center;width:100%"><div class="loader"><span></span><span></span><span></span></div></div>`;

    try {

        const res = await fetch(`https://omdb-project-j6ae.onrender.com/movies?id=${imdbID}`);
        // const res = await fetch(`http://localhost:5000/movies?id=${imdbID}`);

        const d = await res.json();

        const hasPoster = d.Poster && d.Poster !== 'N/A';
        const ratings = (d.Ratings || []).map(r => `
            <div class="rating-box">
                <span class="rating-source">${r.Source}</span>
                <span class="rating-val">${r.Value}</span>
            </div>
        `).join('');

        inner.innerHTML = `
            <div class="modal-poster-col">
                ${hasPoster ? `<img class="modal-poster" src="${d.Poster}">` : posterFallbackHTML()}
            </div>
            <div class="modal-content">
                <div class="modal-meta-top">
                    <span class="pill accent">${d.Year}</span>
                    <span class="pill">${d.Runtime}</span>
                    <span class="pill">${d.Type}</span>
                </div>
                <h2 class="modal-title">${esc(d.Title)}</h2>
                <p class="modal-plot">${esc(d.Plot)}</p>
                <div class="detail-grid">
                    ${detailItem('Director', d.Director)}
                    ${detailItem('Cast', d.Actors)}
                    ${detailItem('Genre', d.Genre)}
                </div>
                <div class="ratings-row">${ratings}</div>
            </div>
        `;
    } catch (e) {
        inner.innerHTML = `<p>Error loading details.</p>`;
    }
}

function detailItem(label, val) {
    if (!val || val === 'N/A') return '';
    return `<div class="detail-item"><div class="detail-label">${label}</div><div class="detail-value">${esc(val)}</div></div>`;
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    document.body.style.overflow = '';
}

document.getElementById('modal-overlay').addEventListener('click', (e) => { if (e.target.id === 'modal-overlay') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ─── RESET & RESTORE ─── */
function resetToHome() {
    document.getElementById('results-section').hidden = true;
    document.getElementById('state-area').innerHTML = '';
    document.getElementById('hero').classList.remove('compact');
    document.getElementById('q').value = '';
    history.replaceState(null, '', location.pathname);
}

(function restoreFromURL() {
    const p = new URLSearchParams(location.search);
    const q = p.get('q');
    if (!q) return;
    document.getElementById('q').value = q;
    document.getElementById('f-type').value = p.get('type') || '';
    document.getElementById('f-year').value = p.get('year') || '';
    doSearch(parseInt(p.get('page'), 10) || 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
})();