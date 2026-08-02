/* KRTaker landing — production Service Worker
   Strategy: network-first for HTML (always fresh), cache-first for static assets,
   API (/api/*) is NEVER intercepted. */
const CACHE = 'krtaker-site-v23';
const STATIC = [
  'css/style.css',
  'js/main.js',
  'js/chat.js',
  'js/i18n.js',
  'js/tools.js',
  'js/register.js',
  'i18n/i18n-dict.js',
  'manifest.json',
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
