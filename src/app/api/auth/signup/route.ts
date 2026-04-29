import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { email, password, full_name, username, token } = await req.json()
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: invite } = await admin.from('invite_links').select('*').eq('token', token).eq('is_active', true).is('used_by', null).single()
  if (!invite) return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 })
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Invite expired' }, { status: 400 })
  const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { full_name } } })
  if (signUpError || !authData.user) return NextResponse.json({ error: signUpError?.message ?? 'Signup failed' }, { status: 400 })
  await admin.from('users').insert({ id: authData.user.id, email, full_name, username, role: invite.assigned_role ?? 'member', rank: invite.assigned_rank ?? 'distributor', branch_id: invite.assigned_branch ?? null })
  await admin.from('invite_links').update({ is_active: false, used_by: authData.user.id }).eq('id', invite.id)
  return NextResponse.json({ user: authData.user }, { status: 201 })
}
