import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  // Fetch custom user profile rows
  const { data: rows, error } = await admin
    .from('users')
    .select('id,full_name,username,role,rank,is_active,created_at,invited_by')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Fetch auth users to get emails (auth.users always has email)
  let emailMap: Record<string, string> = {}
  try {
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 })
    for (const u of authData?.users ?? []) {
      if (u.email) emailMap[u.id] = u.email
    }
  } catch {
    // emails won't show but users will still load
  }

  // Fetch last activity date per user (within last 30 days)
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentActivities } = await admin
    .from('activities')
    .select('user_id, submitted_at')
    .gte('submitted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('submitted_at', { ascending: false })

  // Build a map: userId → most recent activity date
  const lastActivityMap: Record<string, string> = {}
  for (const a of recentActivities ?? []) {
    if (!lastActivityMap[a.user_id]) lastActivityMap[a.user_id] = a.submitted_at
  }

  const users = (rows ?? []).map(u => {
    const lastActivity = lastActivityMap[u.id] ?? null
    const inactive4Days = !lastActivity || lastActivity < fourDaysAgo
    return {
      ...u,
      email:        emailMap[u.id] ?? null,
      lastActivity,
      inactive4Days,
    }
  })

  return NextResponse.json({ users })
}
