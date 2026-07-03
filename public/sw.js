const CACHE_NAME = 'um-ruha-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Let the browser handle standard API requests normally
  if (event.request.url.includes('googleapis.com') || event.request.url.includes('firebase')) {
    return;
  }

  // Network-First strategy for HTML / Navigation requests to prevent white screen of death on update
  if (event.request.mode === 'navigate' || event.request.url.endsWith('.html') || event.request.url === self.location.origin + '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache with the latest version
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If offline, serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For other requests, use Cache-First falling back to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback for offline or failed requests
      });
    })
  );
});
