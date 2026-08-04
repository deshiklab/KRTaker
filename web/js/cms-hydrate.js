/* KRTaker landing — CMS hydration: pulls live content from the super-admin CMS.
   Any element with data-cms="page.section.key" gets its text replaced by the CMS value.
   data-cms-bn="..." applies only when the site is in বাংলা mode.
   Falls back silently to the static HTML if the API is unreachable. */
(function () {
  const API = (window.KR_API_BASE || '/api/') + 'cms-read';
  let lang = 'en';
  try { lang = localStorage.getItem('krtaker_lang') || 'en'; } catch (e) {}

  function apply(map) {
    lang = 'en';
    try { lang = localStorage.getItem('krtaker_lang') || 'en'; } catch (e) {}
    const bn = lang === 'bn';
    // resolve: EN mode → map[key]; BN mode → map[key+'_bn'] if present & non-empty, else skip (keep i18n dict)
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
    document.querySelectorAll('[data-cms-title]').forEach(el => {
      const v = val(el.getAttribute('data-cms-title'));
      if (v !== undefined) el.textContent = v;
    });
    document.title = val('seo.home.meta_title') || document.title;
    document.dispatchEvent(new CustomEvent('krcms', { detail: { map, lang } }));
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
