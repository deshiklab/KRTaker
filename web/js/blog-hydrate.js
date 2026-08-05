/* blog-hydrate.js — append published blog-manager posts to the blog index (.blog-grid).
   Static article cards stay untouched; dynamic posts render at /blog/<slug>. Silent fallback. */
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(String(iso).replace(' ', 'T'));
    if (isNaN(d)) return String(iso).slice(0, 10);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  async function load() {
    try {
      const base = (window.KR_API_BASE || '/api/').replace(/\/$/, '') + '/';
      const r = await fetch(base + 'blog-list');
      const d = await r.json();
      if (!d || !d.ok) return;
      const posts = d.posts || [];
      const grid = document.querySelector('.blog-grid');
      if (!grid || !posts.length) return;
      const existing = new Set(Array.prototype.map.call(document.querySelectorAll('.blog-card h3 a'), function (a) { return a.getAttribute('href'); }));
      posts.forEach(function (p) {
        const href = 'blog/' + p.slug;
        if (existing.has(href)) return;
        const card = document.createElement('div');
        card.className = 'blog-card';
        card.innerHTML =
          '<div class="blog-cover">' + esc(p.cover_emoji || '📰') + '</div>' +
          '<div class="blog-body">' +
          '<span class="blog-tag">' + esc(p.tag || 'Article') + '</span>' +
          '<h3><a href="' + esc(href) + '">' + esc(p.title) + '</a></h3>' +
          '<p>' + esc(p.excerpt || '') + '</p>' +
          '<div class="blog-meta"><span>📅 ' + fmtDate(p.created_at) + '</span><span>⏱ ' + esc(p.read_min || 5) + ' min read</span></div>' +
          '</div>';
        grid.appendChild(card);
      });
    } catch (e) { /* silent fallback */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
