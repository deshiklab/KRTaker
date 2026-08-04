/* KRTaker landing — pricing page hydration: renders the 3 plan cards from
   plan_catalog via the public /api/plans endpoint (the same data the super
   admin Packages module edits). Falls back silently to the static HTML when
   the API is unreachable. Also applies CMS section text via data-cms (shared
   with cms-hydrate.js on other pages). */
(function () {
  const API = (window.KR_API_BASE || '/api/') + 'plans';
  const fmt = n => '৳' + Number(n).toLocaleString('en-IN');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function card(p, i, featured) {
    const feats = (Array.isArray(p.features) ? p.features : []).map(f =>
      `<li><span class="ck">✓</span> ${esc(f)}</li>`).join('');
    const btn = i === 2
      ? '<a href="contact.html" class="btn btn-outline btn-block">Contact sales</a>'
      : '<a href="register.html" class="btn btn-outline btn-block">Start free trial</a>';
    return `<div class="price-card${featured ? ' featured' : ''}">
      ${featured ? '<div class="price-flag">MOST POPULAR</div>' : ''}
      <div class="price-name">${esc(p.name)}</div>
      <div class="price-amount">${fmt(p.price)}<span> /month</span></div>
      ${p.tag ? `<div class="price-desc">${esc(p.tag)}</div>` : ''}
      <ul class="price-feats">${feats}</ul>
      ${btn}
    </div>`;
  }

  fetch(API)
    .then(r => { if (!r.ok) throw new Error('plans ' + r.status); return r.json(); })
    .then(j => {
      if (!j || !j.ok || !Array.isArray(j.plans) || j.plans.length === 0) return;
      const grid = document.querySelector('.pricing-grid');
      if (!grid) return;
      const plans = j.plans.slice(0, 3);
      grid.innerHTML = plans.map((p, i) => card(p, i, i === 1)).join('');
      document.dispatchEvent(new CustomEvent('krplans', { detail: { plans: j.plans } }));
    })
    .catch(() => { /* keep static HTML */ });
})();
