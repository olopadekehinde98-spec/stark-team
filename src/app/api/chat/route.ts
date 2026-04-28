import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// GET /api/chat?channel=general&before=<iso>&limit=40
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const channel = searchParams.get('channel') ?? 'general'
  const before  = searchParams.get('before')
  const limit   = Math.min(Number(searchParams.get('limit') ?? '40'), 80)

  let q = supabase
    .from('team_messages')
    .select('id, content, channel, created_at, user_id, users(full_name, rank)')
    .eq('channel', channel)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) q = (q as any).lt('created_at', before)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ messages: (data ?? []).reverse() })
}

// POST /api/chat  { channel, content }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const channel = (body.channel ?? 'general').trim()
  const content = (body.content ?? '').trim()

  if (!content || content.length > 2000)
    return NextResponse.json({ error: 'Content must be 1–2000 characters' }, { status: 400 })

  const allowed = ['general', 'branch', 'leadership']
  if (!allowed.includes(channel))
    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })

  // leadership channel restricted to leader/admin
  if (channel === 'leadership') {
    const { data: prof } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!prof || !['leader', 'admin'].includes(prof.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: msg, error } = await supabase
    .from('team_messages')
    .insert({ user_id: user.id, channel, content })
    .select('id, content, channel, created_at, user_id, users(full_name, rank)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: msg }, { status: 201 })
}

// DELETE /api/chat?id=<uuid>  (soft-delete — own msg or admin/leader)
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data: prof } = await supabase.from('users').select('role').eq('id', user.id).single()
  const isPrivileged = prof?.role === 'leader' || prof?.role === 'admin'

  const { data: msg } = await supabase.from('team_messages').select('user_id').eq('id', id).single()
  if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (msg.user_id !== user.id && !isPrivileged)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  await admin.from('team_messages').update({ is_deleted: true }).eq('id', id)

  return NextResponse.json({ ok: true })
}
