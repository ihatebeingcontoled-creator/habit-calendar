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
   Whenever you change index.html or app.js: rebuild app.min.js (npx esbuild app.js --minify --outfile=app.min.js),
   then bump SHELL_VERSION here AND the ?v= number on the app.min.js line in index.html (and in SHELL below). */
const SHELL_VERSION = 'shell-v4';
const SHELL = ['/', '/index.html', '/app.min.js?v=3', '/favicon.png', '/manifest.json'];

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
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
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
