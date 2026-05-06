const CACHE = 'color-hunt-v1';
const PRECACHE = ['/', '/src/main.tsx'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first pour les requêtes API, cache-first pour les assets statiques
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Toujours réseau pour les API et sockets
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) {
    return;
  }

  // Cache-first pour les assets (images, fonts, JS/CSS buildés)
  if (e.request.destination === 'image' || e.request.destination === 'font') {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            cache.put(e.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // Network-first avec fallback cache pour la navigation
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match('/') ?? new Response('Hors ligne', { status: 503 })
      )
    );
  }
});
