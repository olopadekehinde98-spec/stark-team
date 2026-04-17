import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') ?? 'monthly'
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('leaderboard_snapshots').select('user_id,score,rank_position')
    .eq('period', period).eq('snapshot_date', today).order('rank_position',{ascending:true}).limit(50)
  return NextResponse.json({ entries: data })
}