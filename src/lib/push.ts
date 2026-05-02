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

/** Send a push notification to a single user (all their subscribed devices). */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const admin = createAdminClient()
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint,p256dh,auth')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return

  const message = JSON.stringify(payload)
  const dead: string[] = []

  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        message,
        { TTL: 60 * 60 * 24 } // 24h
      )
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) dead.push(s.endpoint)
    }
  }))

  // Remove expired subscriptions
  if (dead.length) {
    await admin.from('push_subscriptions').delete().in('endpoint', dead)
  }
}

/** Send a push notification to ALL users (e.g. announcements). */
export async function sendPushToAll(payload: PushPayload) {
  const admin = createAdminClient()
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('user_id,endpoint,p256dh,auth')

  if (!subs || subs.length === 0) return

  const message = JSON.stringify(payload)
  const dead: string[] = []

  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        message,
        { TTL: 60 * 60 * 24 }
      )
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) dead.push(s.endpoint)
    }
  }))

  if (dead.length) {
    await admin.from('push_subscriptions').delete().in('endpoint', dead)
  }
}
