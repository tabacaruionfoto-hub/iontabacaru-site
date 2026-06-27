/* ═══════════════════════════════════════════════
   GALLERY.JS — Ion Tabacaru Fotograf

   Funcționalități:
   - Citește pozele din /data/gallery.json
   - Aranjează galeria dinamic în funcție de
     dimensiunile reale ale fiecărei poze
   - Filtrare cu tranziție animată
   - Lightbox cu navigare (←→, swipe, ESC)
   ═══════════════════════════════════════════════ */

'use strict';

/* ── ALGORITMUL DE LAYOUT ─────────────────────────────────
 *
 * Grila are 12 coloane și rânduri de 80px (--row-h).
 * Fiecare poză primește un număr de coloane și rânduri
 * proporțional cu raportul ei de aspect.
 *
 * Raport de aspect = lățime / înălțime
 *
 * Exemple de rezoluții frecvente:
 *   4000×6000 → ratio 0.67 → portret standard (3/4)
 *   6000×4000 → ratio 1.50 → peisaj standard (3/2)
 *   6000×6000 → ratio 1.00 → pătrat
 *   7680×4320 → ratio 1.78 → panoramic (16:9)
 *   3000×5000 → ratio 0.60 → portret înalt
 *
 * Celulele corespunzătoare (col × row × 80px):
 *   < 0.65  → 3 col × 5 rând = ~285×400px  (portret înalt)
 *   < 0.90  → 3 col × 4 rând = ~285×320px  (portret)
 *   < 1.30  → 4 col × 4 rând = ~380×320px  (aproape pătrat)
 *   < 1.80  → 4 col × 3 rând = ~380×240px  (peisaj)
 *   ≥ 1.80  → 6 col × 3 rând = ~570×240px  (panoramic)
 */
function getGridConfig(width, height) {
  const ratio = width / height;

  if (ratio < 0.65) return { col: 3, row: 5 }; // portret înalt (2:3)
  if (ratio < 0.90) return { col: 3, row: 4 }; // portret standard (3:4)
  if (ratio < 1.30) return { col: 4, row: 4 }; // aproape pătrat (1:1)
  if (ratio < 1.80) return { col: 4, row: 3 }; // peisaj (3:2, 4:3)
  return              { col: 6, row: 3 };       // panoramic (16:9+)
}

/* Etichete vizuale pentru categorii */
const LABELS = {
  nunta:   'Nuntă',
  cuplu:   'Cuplu',
  familie: 'Familie',
  portret: 'Portret',
};

/* ── STATE ──────────────────────────────────────────────── */
let allPhotos     = [];
let currentFilter = 'all';
let lbIndex       = 0;

/* ── RANDARE GALERIE ─────────────────────────────────────── */
function renderGallery(photos) {
  const grid = document.getElementById('gallery');
  grid.innerHTML = '';

  if (photos.length === 0) {
    grid.innerHTML = '<p class="gallery-empty">Pozele apar după ce sunt adăugate din panoul de admin (/admin).</p>';
    return;
  }

  photos.forEach((photo, idx) => {
    const w = photo.width  || 4;
    const h = photo.height || 5;
    const { col, row } = getGridConfig(w, h);

    const item = document.createElement('div');
    item.className  = 'g-item';
    item.dataset.cat = photo.category || 'all';
    item.dataset.idx = idx;

    /* Aplică spans-urile pe desktop (ignorate pe mobil de CSS columns) */
    item.style.gridColumn = `span ${col}`;
    item.style.gridRow    = `span ${row}`;

    item.innerHTML = `
      <img
        class="g-photo"
        src="${photo.image}"
        alt="${photo.alt || ''}"
        loading="lazy"
      >
      <div class="g-overlay">
        <svg class="g-expand-icon" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </div>
      <span class="g-tag">${LABELS[photo.category] || photo.category}</span>
    `;

    /* Click → lightbox */
    item.addEventListener('click', () => openLightbox(idx));

    /* Long press pe mobil (480ms) → lightbox */
    let pressTimer;
    item.addEventListener('touchstart', (e) => {
      pressTimer = setTimeout(() => {
        e.preventDefault();
        openLightbox(idx);
      }, 480);
    }, { passive: false });
    item.addEventListener('touchend',  () => clearTimeout(pressTimer));
    item.addEventListener('touchmove', () => clearTimeout(pressTimer));

    grid.appendChild(item);
  });
}

/* ── FILTRARE ────────────────────────────────────────────── */
function applyFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.g-item').forEach(item => {
    const visible = filter === 'all' || item.dataset.cat === filter;
    item.classList.toggle('hidden', !visible);
  });
}

function setupFilters() {
  document.querySelectorAll('.gallery-filters button').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.gallery-filters button').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      applyFilter(this.dataset.cat);
    });
  });
}

/* ── ÎNCĂRCARE DIN JSON ──────────────────────────────────── */
async function loadGallery() {
  try {
    const res = await fetch('/data/gallery.json');
    if (!res.ok) throw new Error('Fișierul gallery.json nu a fost găsit.');
    const data = await res.json();
    allPhotos = data.photos || [];
    renderGallery(allPhotos);
    setupFilters();
  } catch (err) {
    console.warn('[Gallery]', err.message);
    document.getElementById('gallery').innerHTML =
      '<p class="gallery-empty">Previzualizare locală — pozele apar după deploy pe Netlify.</p>';
  }
}

/* ── LIGHTBOX ────────────────────────────────────────────── */

function getVisiblePhotos() {
  return allPhotos.filter(p =>
    currentFilter === 'all' || p.category === currentFilter
  );
}

function openLightbox(globalIdx) {
  const visible = getVisiblePhotos();
  const photo = allPhotos[globalIdx];
  lbIndex = visible.indexOf(photo);
  if (lbIndex === -1) lbIndex = 0;
  showLightboxAt(lbIndex);
}

function showLightboxAt(idx) {
  const visible = getVisiblePhotos();
  if (visible.length === 0) return;
  const photo = visible[idx] || visible[0];

  document.getElementById('lb-img').src        = photo.image;
  document.getElementById('lb-img').alt        = photo.alt || '';
  document.getElementById('lb-caption').textContent = photo.alt || '';
  document.getElementById('lb-counter').textContent = `${idx + 1} / ${visible.length}`;

  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
  lbIndex = idx;
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function navigateLightbox(dir) {
  const visible = getVisiblePhotos();
  lbIndex = (lbIndex + dir + visible.length) % visible.length;
  showLightboxAt(lbIndex);
}

/* ── EVENT LISTENERS LIGHTBOX ─────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('lb-close').addEventListener('click', closeLightbox);

  document.getElementById('lb-prev').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(-1);
  });

  document.getElementById('lb-next').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(1);
  });

  /* Click în afara fotografiei → închide */
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeLightbox();
  });

  /* Taste: ESC, ←, → */
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('lightbox').classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });

  /* Swipe pe mobil */
  let touchStartX = 0;
  const lb = document.getElementById('lightbox');
  lb.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) navigateLightbox(diff > 0 ? 1 : -1);
  }, { passive: true });

  /* Pornire */
  loadGallery();
});
