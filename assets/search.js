/* ============================================================
   Tech Blog — search.js
   Full article search: text query, type filtering, sorting.
   ============================================================ */

const ARCHETYPES = ['Deep Dive', 'Explainer', 'Reflection', 'Opinion', 'Framework'];

let articles = [];
let activeType  = 'all';
let searchQuery = '';
let sortMode    = 'date-desc';
let filtersVisible = true;
let visibleCount = 5;

/* ── Bootstrap ───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search-input');
  if (input) {
    input.addEventListener('input', e => {
      searchQuery = e.target.value.trim();
      visibleCount = 5;
      renderArticles();
    });
  }

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      sortMode = e.target.value;
      visibleCount = 5;
      renderArticles();
    });
  }

  const filterToggle = document.getElementById('filter-toggle');
  if (filterToggle) {
    filterToggle.addEventListener('click', toggleFilters);
  }

  loadArticles();
});

async function loadArticles() {
  try {
    const res = await fetch('index.json?v=' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    articles = await res.json();
    renderTypeFilters();
    renderArticles();
  } catch (err) {
    document.getElementById('article-list').innerHTML =
      '<p class="error">Could not load articles. Make sure you are viewing this page over HTTP (not file://).</p>';
    console.error('Failed to load index.json:', err);
  }
}

/* ── Filter toggle ───────────────────────────────────────── */

function toggleFilters() {
  filtersVisible = !filtersVisible;
  const panel = document.getElementById('type-filters');
  const btn   = document.getElementById('filter-toggle');
  const icon  = btn.querySelector('.filter-toggle-icon');

  panel.classList.toggle('tag-filters--hidden', !filtersVisible);
  btn.setAttribute('aria-expanded', filtersVisible);
  icon.textContent = filtersVisible ? '▾' : '▸';
}

/* ── Sorting ─────────────────────────────────────────────── */

function getSorted(list) {
  const copy = [...list];
  switch (sortMode) {
    case 'date-asc':   return copy.sort((a, b) => a.date.localeCompare(b.date));
    case 'title-asc':  return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc': return copy.sort((a, b) => b.title.localeCompare(a.title));
    case 'date-desc':
    default:           return copy.sort((a, b) => b.date.localeCompare(a.date));
  }
}

/* ── Filtering ───────────────────────────────────────────── */

function getFiltered() {
  const q = searchQuery.toLowerCase();
  const filtered = articles.filter(a => {
    const matchesType =
      activeType === 'all' || (a.type || '') === activeType;

    if (!q) return matchesType;

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

    return matchesType && searchable.includes(q);
  });

  return getSorted(filtered);
}

/* ── Render: Type Filters ────────────────────────────────── */

function renderTypeFilters() {
  const container = document.getElementById('type-filters');
  container.innerHTML = '';

  const mkBtn = (label, type) => {
    const btn = document.createElement('button');
    btn.className = 'tag-btn' + (activeType === type ? ' active' : '');
    btn.textContent = label;
    btn.addEventListener('click', () => {
      activeType = type;
      visibleCount = 5;
      renderTypeFilters();
      renderArticles();
    });
    return btn;
  };

  container.appendChild(mkBtn('All', 'all'));
  ARCHETYPES.forEach(type => container.appendChild(mkBtn(type, type)));
}

/* ── Render: Results Header ──────────────────────────────── */

function renderResultsHeader(count) {
  const el = document.getElementById('results-header');
  if (!el) return;
  if (articles.length === 0) { el.textContent = ''; return; }
  const total = articles.length;
  el.textContent = count === total
    ? `${total} article${total !== 1 ? 's' : ''}`
    : `${count} of ${total} article${total !== 1 ? 's' : ''}`;
}

/* ── Render: Article Cards ───────────────────────────────── */

function renderArticles() {
  const filtered = getFiltered();
  const container = document.getElementById('article-list');
  const loadMoreCta = document.getElementById('load-more-cta');

  renderResultsHeader(filtered.length);

  if (articles.length === 0) {
    container.innerHTML = '<p class="no-results">No articles published yet.</p>';
    if (loadMoreCta) loadMoreCta.innerHTML = '';
    return;
  }

  if (filtered.length === 0) {
    container.innerHTML = '<p class="no-results">No articles match your search.</p>';
    if (loadMoreCta) loadMoreCta.innerHTML = '';
    return;
  }

  const visible = filtered.slice(0, visibleCount);
  container.innerHTML = visible.map(a => cardHTML(a)).join('');

  // Load more button
  if (loadMoreCta) {
    const remaining = filtered.length - visibleCount;
    if (remaining > 0) {
      loadMoreCta.innerHTML =
        `<div class="load-more-cta"><button class="load-more-btn">Load more (${remaining} remaining)</button></div>`;
      loadMoreCta.querySelector('.load-more-btn').addEventListener('click', () => {
        visibleCount += 5;
        renderArticles();
      });
    } else {
      loadMoreCta.innerHTML = '';
    }
  }
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
