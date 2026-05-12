import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToAll } from '@/lib/push'

/**
 * GET /api/cron/goal-reminder
 * Called by Vercel Cron at 4:00 AM UTC (= 5:00 AM WAT Nigeria) every day.
 * Sends a silent push notification + in-app notification to EVERY active user
 * reminding them to set their daily goal before 12:00 PM Nigeria time.
 */
export async function GET(req: NextRequest) {
  // Secure the cron endpoint — only Vercel or a holder of CRON_SECRET can trigger it
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Fetch all active user IDs
  const { data: users } = await admin
    .from('users')
    .select('id')
    .eq('is_active', true)

  if (!users || users.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  // Insert an in-app notification for every user
  const notifications = users.map((u: any) => ({
    user_id:        u.id,
    type:           'reminder',
    title:          '🎯 Set Your Daily Goal Now',
    body:           'Goal creation closes at 12:00 PM Nigeria time. Write your goal before the window closes!',
    reference_type: 'goal',
    is_read:        false,
  }))

  // Insert in batches of 100 to avoid Supabase payload limits
  const BATCH = 100
  for (let i = 0; i < notifications.length; i += BATCH) {
    await admin.from('notifications').insert(notifications.slice(i, i + BATCH))
  }

  // Send push notification to all subscribed devices (silent push — no sound in service worker)
  await sendPushToAll({
    title: '🎯 Set Your Daily Goal',
    body:  'Goal window is open! Write your goal before 12:00 PM Nigeria time.',
    url:   '/goals/create',
    tag:   'daily-goal-reminder',
  }).catch(() => {})

  return NextResponse.json({ ok: true, sent: users.length })
}
