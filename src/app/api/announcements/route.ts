import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// GET /api/announcements — public read for authenticated users
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, body, is_pinned, created_at, author_id, users(full_name)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ announcements: data ?? [] })
}

// POST /api/announcements — admin/leader only
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: prof } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!prof || !['admin', 'leader'].includes(prof.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const title     = (body.title ?? '').trim()
  const text      = (body.body ?? '').trim()
  const is_pinned = !!body.is_pinned

  if (!title || !text)
    return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
  if (title.length > 200 || text.length > 5000)
    return NextResponse.json({ error: 'Content too long' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('announcements')
    .insert({ author_id: user.id, title, body: text, is_pinned })
    .select('id, title, body, is_pinned, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ announcement: data }, { status: 201 })
}
