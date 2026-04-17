import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase
    .from('notifications').select('id,type,title,body,created_at,is_read')
    .eq('user_id', user.id).order('created_at',{ascending:false}).limit(30)
  return NextResponse.json({ notifications: data })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
  return NextResponse.json({ success: true })
}