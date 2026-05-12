import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params  = await _params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check role — leaders & admins can view any goal
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = profile?.role ?? 'member'
  const admin = createAdminClient()

  // Fetch goal via admin client (bypasses goals_own RLS)
  const query = admin.from('goals').select('*').eq('id', params.id)
  // Members can only see their own goals
  if (role === 'member') query.eq('user_id', user.id)
  const { data: goal, error } = await query.single()
  if (error || !goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

  // Fetch evidence (activities linked to this goal) via admin client
  const { data: evidence } = await admin
    .from('activities')
    .select('id,title,activity_type,status,submitted_at,proof_url,proof_type,description')
    .eq('goal_id', params.id)
    .order('submitted_at', { ascending: false })

  // Fetch goal owner name
  const { data: owner } = await admin.from('users').select('full_name,rank').eq('id', goal.user_id).single()

  return NextResponse.json({ goal, evidence: evidence ?? [], owner })
}

export async function PATCH(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { data, error } = await supabase.from('goals').update(body).eq('id', params.id).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
