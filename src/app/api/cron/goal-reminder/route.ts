import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToAll } from '@/lib/push'

/**
 * GET /api/cron/goal-reminder
 * Vercel Cron fires this at 4:00 AM UTC = 5:00 AM Nigeria WAT every day.
 * Sends a push notification + in-app notification to every active user.
 *
 * Vercel automatically passes: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  // Verify Vercel cron secret (Authorization: Bearer <secret>)
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
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
  const now = new Date().toISOString()
  const notifications = users.map((u: any) => ({
    user_id:        u.id,
    type:           'reminder',
    title:          '🎯 Set Your Daily Goal Now',
    body:           'Goal window is open until 12:00 PM Nigeria time. Write your goal before it closes!',
    reference_type: 'goal',
    is_read:        false,
    created_at:     now,
  }))

  // Insert in batches of 100
  for (let i = 0; i < notifications.length; i += 100) {
    await admin.from('notifications').insert(notifications.slice(i, i + 100))
  }

  // Send push to all subscribed devices — silent visual pop-up
  await sendPushToAll({
    title: '🎯 Set Your Daily Goal',
    body:  'Goal window is open! Write your goal before 12:00 PM Nigeria time.',
    url:   '/goals/create',
    tag:   'daily-goal-reminder',
  }).catch(() => {})

  return NextResponse.json({ ok: true, sent: users.length })
}
