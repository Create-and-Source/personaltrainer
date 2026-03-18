const CACHE_NAME = 'forge-pt-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Clean old caches
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Network-first strategy
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Push notification handler
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'FORGE Training';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url || '/',
    actions: data.actions || [],
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.openWindow(e.notification.data || '/')
  );
});
