import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('activities').select('*,users(full_name,rank,username)').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { data: activity } = await supabase.from('activities').select('user_id,submitted_at,status').eq('id', params.id).single()
  if (!activity || activity.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (activity.status !== 'pending') return NextResponse.json({ error: 'Cannot edit after review' }, { status: 400 })
  const submitted = new Date(activity.submitted_at)
  if (Date.now() - submitted.getTime() > 24 * 60 * 60 * 1000) return NextResponse.json({ error: 'Edit window closed' }, { status: 400 })
  const { data, error } = await supabase.from('activities').update(body).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
