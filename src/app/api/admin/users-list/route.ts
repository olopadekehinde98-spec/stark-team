import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  // Fetch custom user profile rows
  const { data: rows, error } = await admin
    .from('users')
    .select('id,full_name,username,role,rank,is_active,created_at,sponsor_id')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Fetch auth users to get emails (auth.users always has email)
  let emailMap: Record<string, string> = {}
  try {
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 })
    for (const u of authData?.users ?? []) {
      if (u.email) emailMap[u.id] = u.email
    }
  } catch {
    // emails won't show but users will still load
  }

  const users = (rows ?? []).map(u => ({
    ...u,
    email: emailMap[u.id] ?? null,
  }))

  return NextResponse.json({ users })
}
