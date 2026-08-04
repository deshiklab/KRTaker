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

   Advanced (SA1-fullsite v2):
   - Section visibility: cms-read 'vis' map hides whole sections (closest <section>/container).
   - Announcement bar: site.announcement.enabled=1 + text → top banner (with link).
   - GA4: site.analytics.ga4_id replaces the placeholder GA id.
   - Custom code: site.code.head injected into <head>, site.code.footer before </body>.

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

  function apply(map, vis) {
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
    // visibility: hide sections whose page.section is switched off
    if (vis) {
      document.querySelectorAll('[data-cms], [data-cms-html], [data-cms-ph], [data-cms-href], [data-cms-img]').forEach(el => {
        const key = el.getAttribute('data-cms') || el.getAttribute('data-cms-html') || el.getAttribute('data-cms-ph') ||
                    el.getAttribute('data-cms-href') || el.getAttribute('data-cms-img') || '';
        const parts = key.split('.');
        if (parts.length >= 2 && vis[parts[0] + '.' + parts[1]] === 0) {
          const host = el.closest('section') || el.closest('.page-hero') || el.closest('.cta-section') || el.closest('footer') || el;
          if (host && host !== el) host.style.display = 'none';
          else el.style.display = 'none';
        }
      });
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
    // site-wide extras
    applySiteWide(map);
    document.dispatchEvent(new CustomEvent('krcms', { detail: { map, lang: bn ? 'bn' : 'en' } }));
  }

  function applySiteWide(map) {
    // GA4 id
    const ga = (map['site.analytics.ga4_id'] || '').trim();
    if (ga && /^G-[A-Z0-9]{4,}$/i.test(ga)) {
      document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').forEach(s => {
        s.src = s.src.replace(/G-[A-Z0-9]{4,}/i, ga);
      });
      document.querySelectorAll('script').forEach(s => {
        if (/gtag\('config'/.test(s.textContent || '') && /G-[A-Z0-9]{4,}/.test(s.textContent || '')) {
          s.textContent = s.textContent.replace(/G-[A-Z0-9]{4,}/g, ga);
        }
      });
    }
    // custom head code
    const head = (map['site.code.head'] || '').trim();
    if (head && !document.getElementById('krcms-head')) {
      const s = document.createElement('div');
      s.id = 'krcms-head';
      s.innerHTML = head;
      document.head.appendChild(s);
    }
    // custom footer code
    const foot = (map['site.code.footer'] || '').trim();
    if (foot && !document.getElementById('krcms-foot')) {
      const s = document.createElement('div');
      s.id = 'krcms-foot';
      s.innerHTML = foot;
      document.body.appendChild(s);
    }
    // announcement bar
    const annOn = (map['site.announcement.enabled'] || '0') === '1';
    const annText = (map['site.announcement.text'] || '').trim();
    if (annOn && annText && !document.getElementById('krcms-ann')) {
      const link = (map['site.announcement.link'] || '').trim();
      const bar = document.createElement('div');
      bar.id = 'krcms-ann';
      bar.setAttribute('style', 'position:relative;z-index:9999;background:linear-gradient(90deg,#2F80ED,#1E5EB8);color:#fff;text-align:center;font-size:13.5px;font-weight:600;padding:9px 16px;font-family:Inter,system-ui,sans-serif');
      if (link) {
        const a = document.createElement('a');
        a.href = link;
        a.style.cssText = 'color:#fff;text-decoration:underline;display:block';
        a.textContent = annText;
        bar.appendChild(a);
      } else {
        bar.textContent = annText;
      }
      document.body.insertBefore(bar, document.body.firstChild);
    }
  }

  let cached = null;
  let cachedVis = null;
  document.addEventListener('kri18n', () => { if (cached) apply(cached, cachedVis); });
  document.addEventListener('DOMContentLoaded', () => {
    if (cached) apply(cached, cachedVis);
  });

  fetch(API)
    .then(r => { if (!r.ok) throw new Error('cms-read ' + r.status); return r.json(); })
    .then(j => { if (j && j.ok && j.map) { cached = j.map; cachedVis = j.vis || null; apply(j.map, cachedVis); } })
    .catch(() => { /* keep static HTML */ });
})();
