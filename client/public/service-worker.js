// Service Worker for Bear Sauna PWA
const CACHE_NAME = 'bear-sauna-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/assets/index.css',
  '/assets/index.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('Service Worker: Removing old cache', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  
  // Immediately take control of all clients
  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip API calls but handle them separately to show offline message if they fail
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // For API requests that fail, we don't serve anything
          // The app will handle displaying appropriate offline UI elements
          return new Response(JSON.stringify({ 
            error: 'You are offline',
            offline: true 
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response
            const responseToCache = networkResponse.clone();

            // Add to cache for future
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // Network request failed, try to serve the offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // For other resources, just return what we have
            return caches.match(event.request);
          });
      })
  );
});