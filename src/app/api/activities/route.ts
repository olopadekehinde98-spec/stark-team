import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase
    .from('activities').select('id,title,activity_type,activity_date,status,submitted_at,proof_url,proof_type,edit_locked_at')
    .eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(50)
  return NextResponse.json({ activities: data })
}