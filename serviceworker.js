const CACHE_NAME = 'my-app-v1';
const urlsToCache = [
  '/'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  const isHtml =
    event.request.headers.get('Accept')?.includes('text/html') ||
    requestUrl.pathname.endsWith('.html');

  if (isHtml) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
