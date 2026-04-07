// Savdoon Service Worker - PWA V2 (Auto-Update Force)
const CACHE_NAME = `savdoon-v${new Date().getTime()}`; // Dynamic versioning
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/vite.svg'
];

// Install: Pre-cache static assets
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the waiting service worker to become active
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// Activate: Clean old caches immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('Service Worker: Clearing Old Cache', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Take control of all clients immediately
});

// Fetch: Network-first for everything to ensure freshness, with cache fallback
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Bypass cache for POST/PUT/DELETE
    if (event.request.method !== 'GET') return;

    // Strategy for Document/API: Network-first
    if (event.request.destination === 'document' || url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Strategy for Assets (JS, CSS, Images): Cache-first (stale-while-revalidate)
    event.respondWith(
        caches.match(event.request).then((cached) => {
            const fetched = fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => cached); // Gracefully handle network errors
            return cached || fetched;
        }).catch(() => {
            // Last resort fallback
            return null;
        })
    );
});

// Background Sync: Queue cart ops for when online
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-cart') event.waitUntil(syncCart());
    if (event.tag === 'sync-orders') event.waitUntil(syncOrders());
});

async function syncCart() {
    try {
        const cache = await caches.open('savdoon-pending');
        const requests = await cache.keys();
        for (const request of requests) {
            if (request.url.includes('/cart/')) {
                const response = await cache.match(request);
                const data = await response.json();
                await fetch(request, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
                await cache.delete(request);
            }
        }
    } catch (e) { /* retry later */ }
}

async function syncOrders() {
    try {
        const cache = await caches.open('savdoon-pending');
        const requests = await cache.keys();
        for (const request of requests) {
            if (request.url.includes('/orders/')) {
                const response = await cache.match(request);
                const data = await response.json();
                await fetch(request, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
                await cache.delete(request);
            }
        }
    } catch (e) { /* retry later */ }
}
