// Unregister old service worker and clear caches
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => {
        self.registration.unregister();
        clients.forEach((c) => c.navigate(c.url));
      })
  );
});
