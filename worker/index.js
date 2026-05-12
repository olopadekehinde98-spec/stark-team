/* eslint-disable no-restricted-globals */

self.addEventListener('push', function(event) {
  if (!event.data) return;

  var payload;
  try { payload = event.data.json(); } catch(e) { payload = { body: event.data.text() }; }

  var title = payload.title || 'Stark Team';
  var options = {
    body:     payload.body  || '',
    icon:     payload.icon  || '/icons/icon-192.png',
    badge:    '/icons/icon-96.png',
    data:     { url: payload.url || '/dashboard' },
    vibrate:  [200, 100, 200],
    tag:      payload.tag   || 'stark-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        var client = list[i];
        if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
