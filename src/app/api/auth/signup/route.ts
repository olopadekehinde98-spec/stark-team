import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { email, password, full_name, username, token } = await req.json()
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: invite } = await admin.from('invite_links').select('*').eq('token', token).eq('is_used', false).single()
  if (!invite) return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 })
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Invite expired' }, { status: 400 })
  const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { full_name } } })
  if (signUpError || !authData.user) return NextResponse.json({ error: signUpError?.message ?? 'Signup failed' }, { status: 400 })
  await admin.from('users').insert({ id: authData.user.id, email, full_name, username, role: invite.role ?? 'member', rank: invite.rank ?? 'distributor', branch_id: invite.branch_id ?? null })
  await admin.from('invite_links').update({ is_used: true, used_by: authData.user.id, used_at: new Date().toISOString() }).eq('id', invite.id)
  return NextResponse.json({ user: authData.user }, { status: 201 })
}
