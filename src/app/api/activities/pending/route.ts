import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role,branch_id').eq('id',user.id).single()
  if (profile?.role !== 'leader' && profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const { data: members } = profile.branch_id
    ? await admin.from('users').select('id').eq('branch_id', profile.branch_id)
    : { data: [] }
  const ids = (members??[]).map((m:any)=>m.id)
  if (!ids.length) return NextResponse.json({ activities: [] })
  const { data } = await admin.from('activities')
    .select('id,title,activity_type,activity_date,proof_url,submitted_at,user_id,users!inner(full_name,rank,branch_id)')
    .eq('status','pending').in('user_id',ids).order('submitted_at',{ascending:true})
  return NextResponse.json({ activities: data })
}