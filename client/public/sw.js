// Human Design Chart - Service Worker
// Bump this when the deployment changes the application shell. Hashed Vite
// assets are fetched network-first below so a stale shell cannot reference a
// chunk that no longer exists after a deploy.
const CACHE_NAME = 'hd-chart-v2';
const STATIC_CACHE = 'hd-static-v2';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/calculate',
  '/blog',
  '/encyclopedia',
];

// Install: precache key pages
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Ignore precache failures - pages may not be available offline
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API and static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests - always go to network
  if (url.pathname.startsWith('/api/')) return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // Always fetch the worker itself from the network so a new deployment can
  // install the cache invalidation logic immediately.
  if (url.pathname === '/sw.js') {
    event.respondWith(fetch(request));
    return;
  }

  // For navigation requests (HTML pages): network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // For static assets (JS, CSS, images, fonts): network-first. Vite emits
  // hashed filenames, but network-first is important when an old app shell
  // is still open while a new deployment is being rolled out.
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/) ||
    url.hostname.includes('cloudfront.net') ||
    url.hostname.includes('unsplash.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
});
