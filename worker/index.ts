/* eslint-disable no-restricted-globals */

self.addEventListener('push', (event: Event) => {
  const pushEvent = event as PushEvent
  if (!pushEvent.data) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any
  try { payload = pushEvent.data.json() } catch { payload = { body: pushEvent.data.text() } }

  const title: string = payload.title ?? 'Stark Team'
  const options: NotificationOptions = {
    body:     payload.body  ?? '',
    icon:     payload.icon  ?? '/icons/icon-192.png',
    badge:    '/icons/icon-96.png',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data:     { url: payload.url ?? '/dashboard' } as any,
    vibrate:  [200, 100, 200],
    tag:      payload.tag ?? 'stark-notification',
    renotify: true,
  }

  // @ts-ignore — self is ServiceWorkerGlobalScope in this context
  pushEvent.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: Event) => {
  const notifEvent = event as NotificationEvent
  notifEvent.notification.close()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const url: string = (notifEvent.notification.data as any)?.url ?? '/dashboard'

  notifEvent.waitUntil(
    // @ts-ignore
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list: readonly Client[]) => {
      for (const client of list) {
        // @ts-ignore
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          ;(client as WindowClient).navigate(url)
          return client.focus()
        }
      }
      // @ts-ignore
      return self.clients.openWindow(url)
    })
  )
})
