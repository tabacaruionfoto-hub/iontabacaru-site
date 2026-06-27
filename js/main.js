/* ═══════════════════════════════════════════════
   MAIN.JS — Ion Tabacaru Fotograf

   - Nav sticky cu efect la scroll
   - Meniu mobil (hamburger)
   - Formular de contact (Netlify Forms)
   - Netlify Identity (redirect spre /admin)
   ═══════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── NAV SCROLL ────────────────────────────── */
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  /* ── MENIU MOBIL ────────────────────────────── */
  const burger   = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');

  burger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    burger.setAttribute('aria-expanded', isOpen);
  });

  /* Închide meniul când se apasă un link */
  navLinks.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ── FORMULAR CONTACT (Netlify Forms) ───────── */
  /*
   * Netlify capturează automat formularele marcate cu
   * data-netlify="true". Trimitem datele cu fetch pentru
   * a evita reîncărcarea paginii.
   *
   * Pași setup (o singură dată în Netlify Dashboard):
   *   Site → Forms → contact → Form notifications
   *   → Add email notification → emailul lui Ion
   */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Se trimite...';

      try {
        await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });

        /* Succes */
        const msg = document.getElementById('formMsg');
        msg.style.display = 'block';
        form.reset();
        btn.textContent = 'Trimite mesajul';
        btn.disabled = false;
        setTimeout(() => { msg.style.display = 'none'; }, 6000);

      } catch (err) {
        btn.textContent = 'Trimite mesajul';
        btn.disabled = false;
        alert('A apărut o eroare. Contactează-ne direct pe email: tabacaruionion@gmail.com');
      }
    });
  }

  /* ── NETLIFY IDENTITY ───────────────────────── */
  /* Redirecționează spre /admin după autentificare */
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on('init', (user) => {
      if (!user) {
        window.netlifyIdentity.on('login', () => {
          document.location.href = '/admin/';
        });
      }
    });
  }

});
