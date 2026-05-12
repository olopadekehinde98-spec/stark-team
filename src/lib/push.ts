import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export interface PushPayload {
  title: string
  body:  string
  url?:  string
  icon?: string
  tag?:  string
}

/** Send to Expo Push API (FCM on Android, APNs on iOS). */
async function sendExpoNotification(tokens: string[], payload: PushPayload) {
  if (tokens.length === 0) return

  const messages = tokens.map(to => ({
    to,
    title:   payload.title,
    body:    payload.body,
    data:    { url: payload.url ?? '/' },
    sound:   'default',
    badge:   1,
    channelId: 'default',
  }))

  // Expo Push API accepts up to 100 messages per request
  const CHUNK = 100
  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK)
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Accept':        'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(chunk),
      })
      const result = await res.json()
      // Collect dead tokens (DeviceNotRegistered)
      const dead: string[] = []
      ;(result.data ?? []).forEach((r: any, idx: number) => {
        if (r.status === 'error' && r.details?.error === 'DeviceNotRegistered') {
          dead.push(chunk[idx].to)
        }
      })
      if (dead.length) {
        const admin = createAdminClient()
        await admin.from('expo_push_tokens').delete().in('token', dead)
      }
    } catch { /* best-effort */ }
  }
}

/** Send a push notification to a single user (web + native). */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const admin = createAdminClient()

  // Fetch web-push subscriptions AND expo tokens in parallel
  const [{ data: webSubs }, { data: expoRows }] = await Promise.all([
    admin.from('push_subscriptions').select('endpoint,p256dh,auth').eq('user_id', userId),
    admin.from('expo_push_tokens').select('token').eq('user_id', userId),
  ])

  const message = JSON.stringify(payload)
  const dead: string[] = []

  // Web push (browsers / PWA)
  await Promise.all((webSubs ?? []).map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        message,
        { TTL: 60 * 60 * 24 },
      )
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) dead.push(s.endpoint)
    }
  }))
  if (dead.length) await admin.from('push_subscriptions').delete().in('endpoint', dead)

  // Expo native push (Android APK / iOS)
  const expoTokens = (expoRows ?? []).map((r: any) => r.token)
  await sendExpoNotification(expoTokens, payload)
}

/** Send a push notification to ALL users (e.g. daily reminder, announcements). */
export async function sendPushToAll(payload: PushPayload) {
  const admin = createAdminClient()

  const [{ data: webSubs }, { data: expoRows }] = await Promise.all([
    admin.from('push_subscriptions').select('user_id,endpoint,p256dh,auth'),
    admin.from('expo_push_tokens').select('token'),
  ])

  const message = JSON.stringify(payload)
  const dead: string[] = []

  // Web push
  await Promise.all((webSubs ?? []).map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        message,
        { TTL: 60 * 60 * 24 },
      )
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) dead.push(s.endpoint)
    }
  }))
  if (dead.length) await admin.from('push_subscriptions').delete().in('endpoint', dead)

  // Expo native push
  const expoTokens = (expoRows ?? []).map((r: any) => r.token)
  await sendExpoNotification(expoTokens, payload)
}
