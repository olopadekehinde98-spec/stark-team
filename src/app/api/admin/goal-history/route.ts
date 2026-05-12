import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

/**
 * GET /api/admin/goal-history
 * Returns all goals whose status changed to 'active' or 'rejected'
 * within the last 7 days. Auto-purges rejected goals older than 7 days.
 */
export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch goals updated (accepted/rejected) within the last 7 days
  const { data: goals, error } = await admin
    .from('goals')
    .select('id,title,goal_type,status,deadline,created_at,updated_at,user_id,category,description,target_metric')
    .in('status', ['active', 'rejected', 'completed'])
    .gte('updated_at', sevenDaysAgo)
    .order('updated_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Hydrate with owner info
  const userIds = [...new Set((goals ?? []).map((g: any) => g.user_id))]
  const { data: users } = await admin.from('users').select('id,full_name,rank').in('id', userIds)
  const userMap = Object.fromEntries((users ?? []).map((u: any) => [u.id, u]))

  return NextResponse.json({
    goals: (goals ?? []).map((g: any) => ({ ...g, owner: userMap[g.user_id] ?? null })),
  })
}
