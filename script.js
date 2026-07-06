// animerec — talks to the Jikan API (unofficial MyAnimeList API)
// Docs: https://docs.api.jikan.moe/

const API_BASE = 'https://api.jikan.moe/v4';

const state = {
  type: 'anime',       // 'anime' or 'manga' (manga endpoint also covers manhwa/manhua)
  selectedGenres: new Set(),
  genresByType: { anime: [], manga: [] },
  query: '',
};

const el = {
  tabs: document.querySelectorAll('.tab'),
  genreChips: document.getElementById('genre-chips'),
  resultsGrid: document.getElementById('results-grid'),
  resultsTitle: document.getElementById('results-title'),
  resultsCount: document.getElementById('results-count'),
  searchInput: document.getElementById('search-input'),
  searchBtn: document.getElementById('search-btn'),
};

// --- Helpers ---

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// --- Genres ---

async function loadGenres(type) {
  if (state.genresByType[type].length) return renderGenres();
  el.genreChips.innerHTML = '<span class="chip loading">Loading genres...</span>';
  try {
    const data = await fetchJSON(`${API_BASE}/genres/${type}`);
    state.genresByType[type] = data.data
      .filter(g => g.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 16); // keep the list manageable
    renderGenres();
  } catch (err) {
    el.genreChips.innerHTML = '<span class="chip loading">Could not load genres.</span>';
  }
}

function renderGenres() {
  const genres = state.genresByType[state.type];
  el.genreChips.innerHTML = '';
  genres.forEach(g => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (state.selectedGenres.has(g.mal_id) ? ' active' : '');
    chip.textContent = g.name;
    chip.addEventListener('click', () => toggleGenre(g.mal_id));
    el.genreChips.appendChild(chip);
  });
}

function toggleGenre(id) {
  if (state.selectedGenres.has(id)) {
    state.selectedGenres.delete(id);
  } else {
    state.selectedGenres.add(id);
  }
  renderGenres();
  runQuery();
}

// --- Results ---

function cardHTML(item, type) {
  const image = item.images?.jpg?.image_url || '';
  const title = item.title || item.title_english || 'Untitled';
  const score = item.score ? item.score.toFixed(1) : '—';
  const subtype = item.type || (type === 'anime' ? 'Anime' : 'Manga');
  const url = item.url || '#';

  return `
    <a class="card" href="${url}" target="_blank" rel="noopener">
      <img src="${image}" alt="${title} cover" loading="lazy">
      <div class="card-body">
        <span class="card-type">${subtype}</span>
        <span class="card-title">${title}</span>
        <div class="card-meta">
          <span class="card-score">★ ${score}</span>
        </div>
      </div>
    </a>
  `;
}

function renderResults(items, type, countLabel) {
  el.resultsCount.textContent = countLabel || '';
  if (!items.length) {
    el.resultsGrid.innerHTML = '<span class="muted">No results. Try different genres or search terms.</span>';
    return;
  }
  el.resultsGrid.innerHTML = items.map(item => cardHTML(item, type)).join('');
}

// --- Queries ---

async function loadTopRanked(type) {
  el.resultsTitle.textContent = 'Top ranked right now';
  el.resultsGrid.innerHTML = '<span class="muted">Loading...</span>';
  try {
    const data = await fetchJSON(`${API_BASE}/top/${type}`);
    renderResults(data.data.slice(0, 20), type, '');
  } catch (err) {
    el.resultsGrid.innerHTML = '<span class="muted">Could not load results. Try again shortly (the API may be rate-limited).</span>';
  }
}

async function searchTitles(type, query, genreIds) {
  el.resultsTitle.textContent = query ? `Results for "${query}"` : 'Filtered results';
  el.resultsGrid.innerHTML = '<span class="muted">Loading...</span>';

  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (genreIds.length) params.set('genres', genreIds.join(','));
  params.set('order_by', 'score');
  params.set('sort', 'desc');
  params.set('limit', '20');

  try {
    const data = await fetchJSON(`${API_BASE}/${type}?${params.toString()}`);
    renderResults(data.data, type, `${data.data.length} results`);
  } catch (err) {
    el.resultsGrid.innerHTML = '<span class="muted">Could not load results. Try again shortly (the API may be rate-limited).</span>';
  }
}

function runQuery() {
  const genreIds = Array.from(state.selectedGenres);
  if (state.query || genreIds.length) {
    searchTitles(state.type, state.query, genreIds);
  } else {
    loadTopRanked(state.type);
  }
}

// --- Events ---

el.tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    el.tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.type = tab.dataset.type; // 'anime' or 'manga'
    state.selectedGenres.clear();
    loadGenres(state.type);
    runQuery();
  });
});

el.searchBtn.addEventListener('click', () => {
  state.query = el.searchInput.value.trim();
  runQuery();
});

el.searchInput.addEventListener('input', debounce(() => {
  state.query = el.searchInput.value.trim();
  runQuery();
}, 500));

el.searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    state.query = el.searchInput.value.trim();
    runQuery();
  }
});

// --- Init ---

loadGenres(state.type);
loadTopRanked(state.type);
