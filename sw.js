/* ── Push notifications (unchanged) ── */
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data.json(); } catch (err) {}
  const title = data.title || 'Reminder';
  const options = {
    body: data.body || '',
    tag: data.tag || 'habitcal',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

/* ── App-shell caching (new) ──
   Serves the page instantly from cache and refreshes it in the background.
   The whole site is index.html now: just upload a changed index.html, nothing else needs touching (this file never needs a version bump for that:
   the page is refreshed in the background and shows the new version on the next open). */
const SHELL_VERSION = 'shell-v27';
const SHELL = ['/', '/index.html', '/favicon.png', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_VERSION).then((cache) =>
      // add each file separately so one missing file can't break the install
      Promise.all(SHELL.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('shell-') && k !== SHELL_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // only handle same-origin GETs, and never touch the API
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/mcp')) return;
  event.respondWith(
    caches.open(SHELL_VERSION).then(async (cache) => {
      // page navigations ignore ?query bits; app.js is matched exactly so ?v=N busts it
      const cached = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
      const refresh = fetch(req)
        .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => cached);
      return cached || refresh;
    })
  );
});
