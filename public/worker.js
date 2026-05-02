// Custom service worker additions — push notifications
// This file is merged with the auto-generated workbox sw.js by next-pwa

self.addEventListener('push', function (event) {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = { title: 'Stark Team', body: event.data.text() }; }

  const title = payload.title || 'Stark Team';
  const options = {
    body:    payload.body  || '',
    icon:    payload.icon  || '/icons/icon-192.png',
    badge:   payload.badge || '/icons/icon-96.png',
    data:    { url: payload.url || '/dashboard' },
    vibrate: [200, 100, 200],
    tag:     payload.tag || 'stark-team-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
