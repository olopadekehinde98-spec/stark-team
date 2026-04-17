import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('leaderboard_weights').select('*').order('created_at', { ascending: false }).limit(1).single()
  if (error) return NextResponse.json({ verified: 1.0, unverified: 0.2, rejected: 0.0 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const admin = createAdminClient()
  const { data, error } = await admin.from('leaderboard_weights').insert({ ...body, updated_by: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
