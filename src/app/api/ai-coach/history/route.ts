import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const today = new Date().toISOString().split('T')[0]
  const { count } = await supabase
    .from('ai_coach_logs').select('*',{count:'exact',head:true})
    .eq('user_id', user.id).gte('created_at', today)
  return NextResponse.json({ count: count ?? 0 })
}