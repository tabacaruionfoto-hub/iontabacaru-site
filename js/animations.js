/* ═══════════════════════════════════════════════
   ANIMATIONS.JS — Ion Tabacaru Fotograf

   1. Intro pagină — linie care se extinde,
      apoi numele apare
   2. Scroll reveal — secțiunile apar lin
      când utilizatorul ajunge la ele
   ═══════════════════════════════════════════════ */

'use strict';

/* ── 1. INTRO PAGINĂ ─────────────────────────────────────── */
function initIntro() {
  const overlay = document.getElementById('intro-overlay');
  const name    = document.getElementById('intro-name');
  const bar     = document.getElementById('intro-bar');

  if (!overlay) return;

  /* Pornește bara și numele după un frame */
  requestAnimationFrame(() => {
    bar.style.width = '100%';
    setTimeout(() => name.classList.add('show'), 200);
  });

  /* Ascunde overlay-ul după terminarea animației */
  setTimeout(() => {
    overlay.classList.add('done');
  }, 1650);
}

/* ── 2. SCROLL REVEAL ────────────────────────────────────── */
function initScrollReveal() {
  /*
   * Observă toate elementele cu class="reveal" sau
   * class="reveal-stagger" și adaugă "reveal-visible"
   * când intră în viewport.
   *
   * Orice element marcat cu .reveal din HTML va beneficia
   * automat de această animație — nu e nevoie de cod extra.
   */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target); /* animă o singură dată */
        }
      });
    },
    {
      threshold: 0.12,           /* 12% din element trebuie să fie vizibil */
      rootMargin: '0px 0px -40px 0px', /* declanșare puțin înainte de margine */
    }
  );

  document.querySelectorAll('.reveal, .reveal-stagger').forEach((el) => {
    observer.observe(el);
  });
}

/* ── PORNIRE ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initIntro();
  initScrollReveal();
});
