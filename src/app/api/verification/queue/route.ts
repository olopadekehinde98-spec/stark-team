import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role,branch_id').eq('id', user.id).single()
  if (!profile || (profile.role !== 'leader' && profile.role !== 'admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data: branchMembers } = profile.branch_id
    ? await supabase.from('users').select('id').eq('branch_id', profile.branch_id)
    : { data: [] }
  const memberIds = (branchMembers ?? []).map((m: any) => m.id)
  if (!memberIds.length) return NextResponse.json([])
  const { data, error } = await supabase.from('activities').select('*,users!inner(full_name,rank,username)').eq('status', 'pending').in('user_id', memberIds).order('submitted_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
