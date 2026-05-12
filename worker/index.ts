// @ts-nocheck
/* eslint-disable no-restricted-globals */

self.addEventListener('push', (event: any) => {
  if (!event.data) return

  let payload: any
  try { payload = event.data.json() } catch { payload = { body: event.data.text() } }

  const title   = payload.title || 'Stark Team'
  const options = {
    body:     payload.body  || '',
    icon:     payload.icon  || '/icons/icon-192.png',
    badge:    '/icons/icon-96.png',
    data:     { url: payload.url || '/dashboard' },
    vibrate:  [200, 100, 200],
    tag:      payload.tag   || 'stark-notification',
    renotify: true,
    silent:   true,        // no sound — visual pop-up only
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list: any[]) => {
      for (const client of list) {
        if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
