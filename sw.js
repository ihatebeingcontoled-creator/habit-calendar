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
