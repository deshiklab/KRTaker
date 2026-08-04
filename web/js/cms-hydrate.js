/* KRTaker landing — CMS hydration: pulls live content from the super-admin CMS.
   Any element with data-cms="page.section.key" gets its text replaced by the CMS value.
   - data-cms      → textContent (plain text)
   - data-cms-html → innerHTML (rich content — admin-authored, safe by role)
   - data-cms-bn   → applies only when the site is in বাংলা mode
   - data-cms-ph   → placeholder attribute
   - data-cms-href → href attribute
   - data-cms-img  → src attribute
   - data-cms-alt  → alt attribute
   - meta[data-cms-content] → content attribute (SEO)
   - data-cms-title → document title element; falls back to seo.<page>.meta_title (page-aware)
   Falls back silently to the static HTML if the API is unreachable. */
(function () {
  const API = (window.KR_API_BASE || '/api/') + 'cms-read';
  function lang() {
    try { return localStorage.getItem('krtaker_lang') || 'en'; } catch (e) { return 'en'; }
  }
  function pageKey() {
    const b = document.body;
    if (b && b.getAttribute('data-page')) return b.getAttribute('data-page');
    const p = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
    const map = { 'index': 'home', 'features': 'features', 'pricing': 'pricing', 'about': 'about', 'contact': 'contact',
                  'how-it-works': 'howitworks', 'ai-caretaker': 'ai', 'for-owners': 'owners', 'for-tenants': 'tenants',
                  'for-partners': 'partners', 'for-nrb': 'nrb', 'legal-compliance': 'legal', 'faq': 'faq', 'tools': 'tools',
                  'blog': 'blog', 'case-studies': 'cases', 'login': 'login', 'register': 'register' };
    return map[p] || 'home';
  }

  function apply(map) {
    const bn = lang() === 'bn';
    function val(key) {
      if (bn) {
        const bnv = map[key + '_bn'];
        if (bnv !== undefined && bnv !== '') return bnv;
        return undefined; // let the i18n dict supply Bengali
      }
      const v = map[key];
      return (v !== undefined && v !== '') ? v : undefined;
    }
    document.querySelectorAll('[data-cms]').forEach(el => {
      const v = val(el.getAttribute('data-cms'));
      if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll('[data-cms-html]').forEach(el => {
      const v = val(el.getAttribute('data-cms-html'));
      if (v !== undefined) el.innerHTML = v;
    });
    document.querySelectorAll('[data-cms-bn]').forEach(el => {
      if (!bn) return;
      const v = val(el.getAttribute('data-cms-bn'));
      if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll('[data-cms-ph]').forEach(el => {
      const v = val(el.getAttribute('data-cms-ph'));
      if (v !== undefined) el.setAttribute('placeholder', v);
    });
    document.querySelectorAll('[data-cms-href]').forEach(el => {
      const v = val(el.getAttribute('data-cms-href'));
      if (v !== undefined) el.setAttribute('href', v);
    });
    document.querySelectorAll('[data-cms-img]').forEach(el => {
      const v = val(el.getAttribute('data-cms-img'));
      if (v !== undefined) el.setAttribute('src', v);
    });
    document.querySelectorAll('[data-cms-alt]').forEach(el => {
      const v = val(el.getAttribute('data-cms-alt'));
      if (v !== undefined) el.setAttribute('alt', v);
    });
    // SEO meta
    document.querySelectorAll('meta[data-cms-content]').forEach(m => {
      const v = val(m.getAttribute('data-cms-content'));
      if (v !== undefined) m.setAttribute('content', v);
    });
    let appliedTitle = null;
    document.querySelectorAll('[data-cms-title]').forEach(el => {
      const v = val(el.getAttribute('data-cms-title'));
      if (v !== undefined) { el.textContent = v; appliedTitle = v; }
    });
    if (!appliedTitle) {
      const page = pageKey();
      const t = val('seo.' + page + '.meta_title');
      if (t) document.title = t;
    }
    document.dispatchEvent(new CustomEvent('krcms', { detail: { map, lang: bn ? 'bn' : 'en' } }));
  }

  let cached = null;
  document.addEventListener('kri18n', () => { if (cached) apply(cached); });
  document.addEventListener('DOMContentLoaded', () => {
    if (cached) apply(cached);
  });

  fetch(API)
    .then(r => { if (!r.ok) throw new Error('cms-read ' + r.status); return r.json(); })
    .then(j => { if (j && j.ok && j.map) { cached = j.map; apply(j.map); } })
    .catch(() => { /* keep static HTML */ });
})();
