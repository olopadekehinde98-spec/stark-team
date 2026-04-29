import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase    = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role, rank, branch_id').eq('id', user.id).single()
  if (!profile || (profile.role !== 'leader' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Admin sees all pending goals; leaders see their branch only
  let query = adminClient
    .from('goals')
    .select('id,title,goal_type,target_metric,deadline,created_at,user_id,users!inner(full_name,username,rank,branch_id,invited_by)')
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: true })

  if (profile.role !== 'admin' && profile.branch_id) {
    // Get branch member IDs
    const { data: members } = await adminClient
      .from('users').select('id').eq('branch_id', profile.branch_id)
    const ids = (members ?? []).map((m: any) => m.id)
    if (!ids.length) return NextResponse.json({ goals: [] })
    query = query.in('user_id', ids) as any
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ goals: data ?? [] })
}
