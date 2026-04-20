/* ============================================================
   Tech Blog — main.js
   Home page: top-3 articles by default, all matches when searching.
   ============================================================ */

let articles = [];
let searchQuery = '';

/* ── Bootstrap ───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search-input');
  if (input) {
    input.addEventListener('input', e => {
      searchQuery = e.target.value.trim();
      renderArticles();
    });
  }
  loadArticles();
});

async function loadArticles() {
  try {
    const res = await fetch('index.json?v=' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    articles = await res.json();
    renderArticles();
  } catch (err) {
    document.getElementById('article-list').innerHTML =
      '<p class="error">Could not load articles. Make sure you are viewing this page over HTTP (not file://).</p>';
    console.error('Failed to load index.json:', err);
  }
}

/* ── Filtering ───────────────────────────────────────────── */

function getFiltered() {
  const q = searchQuery.toLowerCase();
  if (!q) return articles.slice(0, 3); // default: top 3 newest

  return articles.filter(a => {
    const searchable = [
      a.title,
      a.description,
      a.excerpt,
      (a.tags || []).join(' '),
      a.type,
      a.difficulty,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return searchable.includes(q);
  });
}

/* ── Render: Article Cards ───────────────────────────────── */

function renderArticles() {
  const filtered = getFiltered();
  const container = document.getElementById('article-list');

  if (articles.length === 0) {
    container.innerHTML = '<p class="no-results">No articles published yet.</p>';
    return;
  }

  if (filtered.length === 0) {
    container.innerHTML = '<p class="no-results">No articles match your search.</p>';
    return;
  }

  container.innerHTML = filtered.map(a => cardHTML(a)).join('');
}

function cardHTML(a) {
  const tags = (a.tags || [])
    .map(t => `<span class="tag-static">${escHtml(t)}</span>`)
    .join('');

  const typeBadge = a.type       ? `<span class="badge badge-type">${escHtml(a.type)}</span>`           : '';
  const diffBadge = a.difficulty ? `<span class="badge badge-difficulty">${escHtml(a.difficulty)}</span>` : '';

  return `
    <article class="article-card">
      <div class="card-meta">
        ${typeBadge}${diffBadge}
        <time class="card-date">${formatDate(a.date)}</time>
      </div>
      <h2 class="card-title"><a href="${escHtml(a.url)}">${escHtml(a.title)}</a></h2>
      <p class="card-description">${escHtml(a.description || '')}</p>
      <div class="card-tags">${tags}</div>
    </article>
  `;
}

/* ── Helpers ─────────────────────────────────────────────── */

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
