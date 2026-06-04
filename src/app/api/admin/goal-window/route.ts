import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToAll } from '@/lib/push'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: p } = await supabase.from('users').select('role').eq('id', user.id).single()
  return p?.role === 'admin' ? user : null
}

/** GET /api/admin/goal-window — returns { open: boolean } */
export async function GET() {
  // Auth check — only admins may read the override state
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: p } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (p?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', 'goal_window_override')
      .single()
    return NextResponse.json({ open: data?.value === 'true' })
  } catch {
    // app_settings table may not exist yet — treat as override off
    return NextResponse.json({ open: false })
  }
}

/** POST /api/admin/goal-window — body: { open: boolean }
 *  Toggles the override and (if opening) pushes notification to all users */
export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { open } = await request.json()
  const admin = createAdminClient()

  await admin.from('app_settings').upsert({
    key:        'goal_window_override',
    value:      open ? 'true' : 'false',
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  }, { onConflict: 'key' })

  // If opening the window, push notify everyone with the app
  if (open) {
    sendPushToAll({
      title: '🎯 Goal Window Open!',
      body:  'Admin has opened the goal window — create your goal now before it closes.',
      url:   '/goals/create',
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, open })
}
