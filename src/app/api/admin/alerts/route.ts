import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: inactiveUsers } = await supabase.from('users').select('id,full_name,rank').eq('is_active', true).lt('last_active_at', sevenDaysAgo)
  const { data: pendingActivities } = await supabase.from('activities').select('id').eq('status', 'pending').lt('submitted_at', sevenDaysAgo)
  return NextResponse.json({ inactiveUsers: inactiveUsers ?? [], stalePending: pendingActivities?.length ?? 0 })
}
