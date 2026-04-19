const CACHE_NAME = 'sonicstream-v1';
const ASSETS = [
  '/sonicstream-radio/',
  '/sonicstream-radio/index.html',
  '/sonicstream-radio/music.html',
  '/sonicstream-radio/manifest.json'
];

// Install - cache core assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', function(e) {
  // Skip non-GET and external requests (radio streams, APIs)
  if (e.request.method !== 'GET') return;
  
  var url = new URL(e.request.url);
  
  // Only cache our own files - let streams and APIs go direct
  if (url.origin !== location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // Cache successful responses
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // Network failed - try cache
        return caches.match(e.request).then(function(cached) {
          return cached || new Response('Sin conexión', { status: 503 });
        });
      })
  );
});
