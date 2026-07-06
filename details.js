// animerec — title detail page
// Reads ?type=anime&id=123 from the URL and fetches full info from Jikan

const API_BASE = 'https://api.jikan.moe/v4';
const container = document.getElementById('detail-content');

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    type: params.get('type') === 'manga' ? 'manga' : 'anime',
    id: params.get('id'),
  };
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function genreChipsHTML(genres) {
  if (!genres || !genres.length) return '';
  return genres.map(g => `<span class="chip" style="cursor:default;">${g.name}</span>`).join('');
}

function relatedListHTML(relations, currentType) {
  if (!relations || !relations.length) return '';
  const rows = relations
    .filter(r => r.entry && r.entry.length)
    .map(r => {
      const links = r.entry.map(e => {
        const linkType = e.type === 'manga' ? 'manga' : 'anime';
        return `<a href="details.html?type=${linkType}&id=${e.mal_id}">${e.name}</a>`;
      }).join(', ');
      return `<div class="related-row"><span class="related-label">${r.relation}</span><span>${links}</span></div>`;
    });
  return rows.join('');
}

function recCardHTML(rec, type) {
  const entry = rec.entry;
  const image = entry.images?.jpg?.image_url || '';
  return `
    <a class="card" href="details.html?type=${type}&id=${entry.mal_id}">
      <img src="${image}" alt="${entry.title} cover" loading="lazy">
      <div class="card-body">
        <span class="card-title">${entry.title}</span>
      </div>
    </a>
  `;
}

function externalLinksFor(type, title) {
  const q = encodeURIComponent(title);

  if (type === 'anime') {
    return `
      <a class="ext-link crunchyroll" href="https://www.crunchyroll.com/search?q=${q}" target="_blank" rel="noopener">Watch on Crunchyroll</a>
      <a class="ext-link imdb" href="https://www.imdb.com/find/?q=${q}&s=tt" target="_blank" rel="noopener">Find on IMDb</a>
    `;
  }

  // manga / manhwa — link to official, licensed reading platforms only
  return `
    <a class="ext-link webtoon" href="https://www.webtoons.com/en/search?keyword=${q}" target="_blank" rel="noopener">Read on Webtoons</a>
    <a class="ext-link tapas" href="https://tapas.io/search?q=${q}" target="_blank" rel="noopener">Read on Tapas</a>
  `;
}

async function loadDetail() {
  const { type, id } = getParams();

  if (!id) {
    container.innerHTML = '<span class="muted" style="padding:24px;display:block;">No title specified. <a href="index.html">Go back and pick one.</a></span>';
    return;
  }

  try {
    const [fullRes, recRes] = await Promise.all([
      fetchJSON(`${API_BASE}/${type}/${id}/full`),
      fetchJSON(`${API_BASE}/${type}/${id}/recommendations`).catch(() => ({ data: [] })),
    ]);

    const item = fullRes.data;
    const image = item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '';
    const title = item.title || item.title_english || 'Untitled';
    const score = item.score ? item.score.toFixed(1) : '—';
    const synopsis = item.synopsis || 'No synopsis available.';
    const status = item.status || '';
    const countLabel = type === 'anime'
      ? (item.episodes ? `${item.episodes} episodes` : 'Episode count unknown')
      : (item.chapters ? `${item.chapters} chapters` : 'Chapter count unknown');
    const typeLabel = item.type || (type === 'anime' ? 'Anime' : 'Manga');

    const relatedHTML = relatedListHTML(item.relations, type);
    const recs = (recRes.data || []).slice(0, 8);
    const recsHTML = recs.map(r => recCardHTML(r, type)).join('');
    const externalLinksHTML = externalLinksFor(type, title);

    container.innerHTML = `
      <div class="detail-hero">
        <img src="${image}" alt="${title} cover" class="detail-poster">
        <div class="detail-info">
          <span class="card-type">${typeLabel}</span>
          <h1>${title}</h1>
          <div class="detail-meta">
            <span class="card-score">★ ${score}</span>
            <span class="muted">${status}</span>
            <span class="muted">${countLabel}</span>
          </div>
          <div class="chip-row">${genreChipsHTML(item.genres)}</div>
          <div class="external-row">${externalLinksHTML}</div>
        </div>
      </div>

      <section class="detail-section">
        <h2>Synopsis</h2>
        <p class="synopsis">${synopsis}</p>
      </section>

      ${relatedHTML ? `
      <section class="detail-section">
        <h2>Related titles &amp; watch order</h2>
        <div class="related-list">${relatedHTML}</div>
      </section>` : ''}

      ${recsHTML ? `
      <section class="detail-section">
        <h2>If you like this, try...</h2>
        <div class="grid">${recsHTML}</div>
      </section>` : ''}
    `;
  } catch (err) {
    container.innerHTML = '<span class="muted" style="padding:24px;display:block;">Could not load this title. It may be temporarily rate-limited — try again shortly.</span>';
  }
}

loadDetail();
