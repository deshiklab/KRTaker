/* KRTaker landing + dashboard — production Service Worker
   Strategy: network-first for HTML (always fresh), cache-first for static assets,
   API (/api/*) is NEVER intercepted. Push notifications handled for the dashboard. */
const CACHE = 'krtaker-site-v81';
const STATIC = [
  'css/style.css',
  'css/share.css',
  'js/main.js',
  'js/chat.js',
  'js/share.js',
  'js/i18n.js',
  'js/tools.js',
  'js/register.js',
  'i18n/i18n-dict.js',
  'manifest.json',
  'manifest-dash.json',
  'pwa/icon.svg',
  'pwa/icon-192.png',
  'pwa/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // never cache API

  // HTML / navigations: network-first, fall back to cache, then index.html
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() =>
        caches.match(req).then((hit) => hit || caches.match('index.html'))
      )
    );
    return;
  }

  // Static assets: cache-first
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});

/* ── Push notifications (SA1 v19) ── */
self.addEventListener('push', (e) => {
  let data = { title: 'KRTaker', body: '', url: '/dashboard-v2.html' };
  try {
    if (e.data) {
      const parsed = e.data.json();
      if (parsed && typeof parsed === 'object') data = Object.assign(data, parsed);
    }
  } catch (err) { /* non-JSON payload — use defaults */ }
  const opts = {
    body: data.body || '',
    icon: 'pwa/icon-192.png',
    badge: 'pwa/icon-192.png',
    vibrate: [120, 60, 120],
    tag: data.tag || 'kr-notify',
    renotify: true,
    data: { url: data.url || '/dashboard-v2.html', ts: Date.now() }
  };
  e.waitUntil(self.registration.showNotification(data.title || 'KRTaker', opts));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/dashboard-v2.html';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(url); return c.focus(); }
      }
      return clients.openWindow(url);
    })
  );
});
