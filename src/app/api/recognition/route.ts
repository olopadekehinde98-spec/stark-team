import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('recognitions').select('*,issuer:users!issued_by(full_name,rank),recipient:users!recipient_id(full_name,rank,username)').order('created_at', { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'leader' && profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0)
  const { data: limit } = await supabase.from('recognition_weekly_limits').select('count').eq('issuer_id', user.id).gte('week_start', weekStart.toISOString()).single()
  if (limit && limit.count >= 3) return NextResponse.json({ error: 'Weekly recognition limit (3) reached' }, { status: 429 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('recognitions').insert({ ...body, issued_by: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (limit) {
    await admin.from('recognition_weekly_limits').update({ count: limit.count + 1 }).eq('issuer_id', user.id).gte('week_start', weekStart.toISOString())
  } else {
    await admin.from('recognition_weekly_limits').insert({ issuer_id: user.id, week_start: weekStart.toISOString(), count: 1 })
  }
  return NextResponse.json(data, { status: 201 })
}
