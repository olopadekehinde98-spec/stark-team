/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

/** GET /api/admin/override?type=goals|activities
 *  Returns all accepted goals or submitted activities for admin override. */
export async function GET(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'goals'

  if (type === 'goals') {
    const { data } = await admin
      .from('goals')
      .select('id,title,goal_type,status,deadline,created_at,user_id,category,description,target_metric,current_metric')
      .in('status', ['active', 'completed', 'pending_approval', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(100)

    // Hydrate user names
    const userIds = [...new Set((data ?? []).map((g: any) => g.user_id))]
    const { data: users } = await admin.from('users').select('id,full_name,rank').in('id', userIds)
    const userMap = Object.fromEntries((users ?? []).map((u: any) => [u.id, u]))

    return NextResponse.json({
      goals: (data ?? []).map((g: any) => ({ ...g, owner: userMap[g.user_id] ?? null }))
    })
  }

  // Activities
  const { data } = await admin
    .from('activities')
    .select('id,title,activity_type,status,submitted_at,activity_date,user_id,proof_url,description')
    .in('status', ['pending', 'verified'])
    .order('submitted_at', { ascending: false })
    .limit(100)

  const userIds = [...new Set((data ?? []).map((a: any) => a.user_id))]
  const { data: users } = await admin.from('users').select('id,full_name,rank').in('id', userIds)
  const userMap = Object.fromEntries((users ?? []).map((u: any) => [u.id, u]))

  return NextResponse.json({
    activities: (data ?? []).map((a: any) => ({ ...a, owner: userMap[a.user_id] ?? null }))
  })
}

/** POST /api/admin/override
 *  Body: { type: 'goal'|'activity', id: string, action: 'reject'|'reset'|'complete' } */
export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const body  = await request.json()
  const { type, id, action } = body

  if (!type || !id || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  if (type === 'goal') {
    const statusMap: Record<string, string> = {
      reject:   'rejected',
      reset:    'pending_approval',
      complete: 'completed',
    }
    const newStatus = statusMap[action]
    if (!newStatus) return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    const { error } = await admin.from('goals').update({ status: newStatus }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  if (type === 'activity') {
    const statusMap: Record<string, string> = {
      reject: 'rejected',
      reset:  'pending',
    }
    const newStatus = statusMap[action]
    if (!newStatus) return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    const { error } = await admin.from('activities').update({ status: newStatus }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}
