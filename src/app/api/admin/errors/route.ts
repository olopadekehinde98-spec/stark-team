/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await admin
    .from('audit_logs')
    .select('id,actor_id,created_at,target_type,metadata')
    .eq('action', 'client_error')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200)

  // Fetch user names for actor_ids
  const actorIds = [...new Set((data ?? []).map((e: any) => e.actor_id).filter(Boolean))]
  let userMap: Record<string, string> = {}
  if (actorIds.length > 0) {
    const { data: users } = await admin.from('users').select('id,full_name').in('id', actorIds)
    userMap = Object.fromEntries((users ?? []).map((u: any) => [u.id, u.full_name]))
  }

  const errors = (data ?? []).map((e: any) => ({
    id: e.id,
    created_at: e.created_at,
    type: e.target_type,
    message: e.metadata?.message,
    page: e.metadata?.page,
    stack: e.metadata?.stack,
    user: userMap[e.actor_id] ?? 'Unknown',
    userAgent: e.metadata?.userAgent,
  }))

  return NextResponse.json({ errors })
}

export async function DELETE() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  await admin.from('audit_logs').delete().eq('action', 'client_error')
  return NextResponse.json({ success: true })
}
