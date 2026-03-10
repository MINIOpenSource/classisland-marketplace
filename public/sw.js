const CACHE_NAME = 'cipx-assets-0f673ab';

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Delete non-matching caches
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key.startsWith('cipx-assets-') && key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Skip external or API requests if we only want to cache static assets
    const url = new URL(event.request.url);
    if (!url.pathname.startsWith('/_next/') &&
        !url.pathname.startsWith('/svg/') &&
        !url.pathname.startsWith('/iframe/') &&
        !url.pathname.endsWith('.cipx') &&
        url.hostname === location.hostname) {

        // Stale-while-revalidate for generic HTML/assets
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => cachedResponse);

                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    if (url.pathname.startsWith('/_next/')) {
        // Cache-first for Next.js immutable assets
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) return cachedResponse;

                try {
                    const networkResponse = await fetch(event.request);
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                } catch {
                    return new Response('Offline', { status: 503 });
                }
            })
        );
    }
});
