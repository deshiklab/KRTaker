/* KRTaker landing — main.js (nav, theme, reveal, forms) */
document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const t = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  const isMobile = () => window.matchMedia('(max-width:960px)').matches;
  if (t && links) {
    t.addEventListener('click', () => links.classList.toggle('open'));
    // mega triggers: on mobile, tap opens the accordion instead of navigating
    links.querySelectorAll('.mega-trigger').forEach(a => {
      a.addEventListener('click', (e) => {
        if (isMobile()) {
          e.preventDefault();
          const li = a.closest('.mega-li');
          const wasOpen = li.classList.contains('open');
          links.querySelectorAll('.mega-li.open').forEach(x => x.classList.remove('open'));
          if (!wasOpen) li.classList.add('open');
        }
      });
    });
    // close menu when a link is chosen
    links.querySelectorAll('a:not(.mega-trigger)').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
    // close on outside click
    document.addEventListener('click', (e) => {
      if (links.classList.contains('open') && !links.contains(e.target) && !t.contains(e.target)) {
        links.classList.remove('open');
      }
    });
  }

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

  // Back-to-top button
  const btt = document.querySelector('.btt-btn');
  if (btt) {
    const onScroll = () => btt.classList.toggle('show', (window.scrollY || document.documentElement.scrollTop) > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

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

  // Newsletter form → landing API
  const nf = document.getElementById('newsletterForm');
  if (nf) {
    nf.addEventListener('submit', async (e) => {
      e.preventDefault();
      const em = document.getElementById('newsEmail');
      const val = (em.value || '').trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) { krToast('Please enter a valid email.'); return; }
      const btn = nf.querySelector('button');
      btn.disabled = true;
      try {
        const res = await fetch('../api/newsletter', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: val })
        });
        const data = await res.json();
        const d = (window.KR_I18N && KR_I18N[krLang()]) || {};
        krToast(data.ok ? (d['footer.newsDone'] || 'Subscribed — check your inbox to confirm ✓') : (data.error || 'Try again.'));
        if (data.ok) nf.reset();
      } catch (err) { krToast('Network error — please try again.'); }
      btn.disabled = false;
    });
  }
});

/* ── Cookie consent banner (V2.4) ── */
(function () {
  try {
    if (localStorage.getItem('krt_cookie_ok')) return;
    const b = document.createElement('div');
    b.className = 'cookie-bar';
    b.innerHTML = '<span>We use cookies to improve your experience and measure traffic. <a href="privacy.html">Privacy policy</a></span><button class="cookie-ok">Got it</button>';
    document.body.appendChild(b);
    b.querySelector('.cookie-ok').addEventListener('click', function () {
      localStorage.setItem('krt_cookie_ok', '1');
      b.remove();
    });
  } catch (e) {}
})();

/* ── Exit-intent popup (V2.5) — once per session, desktop only ── */
(function () {
  try {
    if (sessionStorage.getItem('krt_exit_shown')) return;
    if (matchMedia('(pointer:coarse)').matches) return; // skip touch devices
    const d = document;
    const modal = d.createElement('div');
    modal.className = 'exit-modal';
    modal.innerHTML =
      '<div class="exit-card">' +
      '<button class="exit-close" aria-label="Close">✕</button>' +
      '<span class="exit-badge">🎁 14-day free trial</span>' +
      '<h3>Put your property on autopilot</h3>' +
      '<p>Leases, rent, TDS, holding tax and maintenance — KR handles it all, 24/7. No credit card needed.</p>' +
      '<a href="register.html" class="btn btn-primary btn-lg">Start free trial →</a>' +
      '<a href="how-it-works.html" class="btn btn-outline">See how it works</a>' +
      '<p class="exit-note">Join 128 subscribers managing ৳74.55 Cr in property</p>' +
      '</div>';
    d.body.appendChild(modal);
    const close = () => { modal.classList.remove('show'); setTimeout(() => modal.remove(), 350); };
    modal.querySelector('.exit-close').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    let armed = false;
    d.addEventListener('mouseleave', (e) => {
      if (!armed || e.clientY > 12) return;
      armed = false;
      sessionStorage.setItem('krt_exit_shown', '1');
      modal.classList.add('show');
    });
    // arm only after the visitor has been on the page a little while
    setTimeout(() => { armed = true; }, 12000);
  } catch (e) {}
})();
