import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id',user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const { data } = await admin.from('invite_links').select('id,token,assigned_role,assigned_rank,assigned_email,expires_at,is_active,used_by,created_at').order('created_at',{ascending:false}).limit(20)
  return NextResponse.json({ invites: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id',user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  const { assigned_role = 'member', assigned_rank = 'distributor', assigned_email, expires_days = 7 } = body
  const expires_at = new Date(Date.now() + expires_days * 86400000).toISOString()
  const admin = createAdminClient()
  const { data, error } = await admin.from('invite_links').insert({
    created_by: user.id, assigned_role, assigned_rank,
    assigned_email: assigned_email||null, expires_at,
  }).select('token').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  // Always use real request origin on production; only fall back to env var if it isn't localhost
  const envUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const origin = (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1'))
    ? envUrl
    : new URL(request.url).origin
  return NextResponse.json({ invite_url: origin + '/signup?token=' + data.token })
}