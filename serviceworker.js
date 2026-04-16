const CACHE_NAME = 'my-app-v2';
const urlsToCache = [
  '/'
];

// ─── INSTALL ───────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// ─── ACTIVATE ──────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── FETCH ─────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // 1. Always fetch fresh for HTML navigation
  const isHtml = event.request.mode === 'navigate';

  // 2. Always fetch fresh for JSON / API calls
  const isApi =
    requestUrl.pathname.endsWith('.json') ||
    requestUrl.pathname.includes('/api/') ||
    requestUrl.hostname.includes('githubusercontent.com') ||
    requestUrl.hostname.includes('imostatic.com');

  if (isHtml || isApi) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request) // fallback to cache if offline
      )
    );
    return;
  }

  // 3. Cache-first for static assets, with dynamic caching on miss
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(networkResponse => {
        // Only cache valid same-origin responses
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== 'basic'
        ) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
