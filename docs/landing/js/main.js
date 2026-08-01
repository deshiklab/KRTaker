/* KRTaker landing — main.js */
document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const t = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (t && links) t.addEventListener('click', () => links.classList.toggle('open'));

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
    window.__krToastT = setTimeout(() => t.classList.remove('show'), 3200);
  };

  // Register form → save to localStorage + demo redirect
  const reg = document.getElementById('registerForm');
  if (reg) {
    reg.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        name: reg.name.value, org: reg.org.value, email: reg.email.value,
        phone: reg.phone.value, role: (reg.querySelector('input[name=acctType]:checked')||{}).value || 'owner',
        plan: (reg.querySelector('input[name=plan]:checked')||{}).value || 'Starter',
        ts: new Date().toISOString()
      };
      let signups = []; try { signups = JSON.parse(localStorage.getItem('krtaker_signups')||'[]'); } catch(err){}
      signups.push(data);
      localStorage.setItem('krtaker_signups', JSON.stringify(signups));
      const box = document.getElementById('regSuccess');
      box.style.display = 'block';
      document.getElementById('regSuccessName').textContent = data.org || data.name;
      reg.style.display = 'none';
      // set the signup into the PWA demo DB key so the new owner exists
      try {
        const key = 'krtaker_db_v3';
        const db = JSON.parse(localStorage.getItem(key) || 'null');
        if (db && db.users) {
          db.users.push({ id:'USR-NEW-'+String(Date.now()).slice(-4), role:'owner', name:data.name, avatar:(data.name||'N').slice(0,2).toUpperCase(), scope:{} });
          localStorage.setItem(key, JSON.stringify(db));
        }
      } catch(err){}
      krToast('Account created 🎉 — redirecting to your workspace…');
      setTimeout(() => { window.location.href = 'https://servers-diagnostic-kirk-jeremy.trycloudflare.com/design-prototype.html'; }, 1600);
    });
  }

  // Login form
  const log = document.getElementById('loginForm');
  if (log) {
    log.addEventListener('submit', (e) => {
      e.preventDefault();
      krToast('Demo login — opening KRTaker workspace…');
      setTimeout(() => { window.location.href = 'https://servers-diagnostic-kirk-jeremy.trycloudflare.com/design-prototype.html'; }, 1200);
    });
  }

  // Contact form
  const cf = document.getElementById('contactForm');
  if (cf) cf.addEventListener('submit', (e) => { e.preventDefault(); krToast('Message sent — we\'ll reply within 24h ✓'); cf.reset(); });
});
