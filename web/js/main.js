/* KRTaker landing — main.js (nav, theme, reveal, forms) */
document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const t = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (t && links) t.addEventListener('click', () => links.classList.toggle('open'));

  // Dark mode toggle
  const THEME_KEY = 'krtaker_theme';
  let theme = 'light';
  try { theme = localStorage.getItem(THEME_KEY) || 'light'; } catch (e) {}
  const applyTheme = (th) => {
    document.documentElement.setAttribute('data-theme', th);
    document.querySelectorAll('[data-theme-toggle]').forEach(b => { b.textContent = th === 'dark' ? '☀️' : '🌙'; });
    try { localStorage.setItem(THEME_KEY, th); } catch (e) {}
  };
  applyTheme(theme);
  document.querySelectorAll('[data-theme-toggle]').forEach(b => {
    b.addEventListener('click', () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
  });

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const a = item.querySelector('.faq-a');
      const open = item.classList.toggle('open');
      a.style.display = open ? 'block' : 'none';
    });
  });

  // Toast helper
  window.krToast = (msg) => {
    let t = document.getElementById('krToast');
    if (!t) { t = document.createElement('div'); t.id = 'krToast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(window.__krToastT);
    window.__krToastT = setTimeout(() => t.classList.remove('show'), 3600);
  };

  // Login form (demo)
  const log = document.getElementById('loginForm');
  if (log) {
    log.addEventListener('submit', (e) => {
      e.preventDefault();
      krToast('Demo login — opening KRTaker workspace…');
      setTimeout(() => { window.location.href = '../design-prototype.html'; }, 1200);
    });
  }

  // Contact form → landing API
  const cf = document.getElementById('contactForm');
  if (cf) {
    cf.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = cf.querySelector('button[type=submit]');
      const orig = btn.textContent;
      btn.disabled = true; btn.textContent = '…';
      try {
        const fd = new FormData(cf);
        const res = await fetch('../api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fd.get('name'), email: fd.get('email'),
            phone: fd.get('phone') || '', subject: fd.get('subject') || '',
            message: fd.get('message')
          })
        });
        const data = await res.json();
        if (data.ok) { krToast('Message sent — we\'ll reply within 24h ✓'); cf.reset(); }
        else krToast(data.error || 'Something went wrong. Try again.');
      } catch (err) { krToast('Network error — please try again.'); }
      btn.disabled = false; btn.textContent = orig;
    });
  }
});
