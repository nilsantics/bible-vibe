const CACHE_NAME = 'bv-v1';
const VERSES_URL_PATTERN = /\/api\/verses/;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Install — skip waiting immediately; nothing to pre-cache
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate — claim all open clients right away
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // --- Cache-first for /api/verses (chapter data), 7-day TTL ---
  if (VERSES_URL_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirstWithTTL(request, SEVEN_DAYS_MS));
    return;
  }

  // --- Network-first with cache fallback for navigation requests ---
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithCacheFallback(request));
    return;
  }

  // --- Network-first for everything else ---
  event.respondWith(networkFirstWithCacheFallback(request));
});

// ---------------------------------------------------------------------------
// Strategy helpers
// ---------------------------------------------------------------------------

async function cacheFirstWithTTL(request, maxAgeMs) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    const cachedDate = cached.headers.get('sw-cached-at');
    if (cachedDate && Date.now() - Number(cachedDate) < maxAgeMs) {
      return cached;
    }
    // Stale — fall through to network
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Clone and stamp with cache timestamp
      const headers = new Headers(networkResponse.headers);
      headers.set('sw-cached-at', String(Date.now()));
      const stamped = new Response(await networkResponse.clone().arrayBuffer(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers,
      });
      await cache.put(request, stamped);
    }
    return networkResponse;
  } catch {
    // Network failed — return stale cache if available
    if (cached) return cached;
    return new Response('Network error', { status: 503 });
  }
}

async function networkFirstWithCacheFallback(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response('Network error', { status: 503 });
  }
}

// ---------------------------------------------------------------------------
// Push notifications
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Bible Vibe', body: event.data.text() };
  }

  const { title = 'Bible Vibe', body = '', url = '/dashboard' } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url },
    })
  );
});

// ---------------------------------------------------------------------------
// Notification click
// ---------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/dashboard';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing tab at the target URL if one exists
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
