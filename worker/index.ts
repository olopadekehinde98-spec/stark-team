/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload: { title?: string; body?: string; url?: string; icon?: string; tag?: string }
  try { payload = event.data.json() } catch { payload = { body: event.data.text() } }

  const title = payload.title ?? 'Stark Team'
  const options: NotificationOptions = {
    body:    payload.body  ?? '',
    icon:    payload.icon  ?? '/icons/icon-192.png',
    badge:   '/icons/icon-96.png',
    data:    { url: payload.url ?? '/dashboard' },
    vibrate: [200, 100, 200],
    tag:     payload.tag ?? 'stark-notification',
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url: string = (event.notification.data?.url) ?? '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          ;(client as WindowClient).navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
