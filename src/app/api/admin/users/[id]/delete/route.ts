import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params   = await _params
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Prevent deleting yourself
  if (params.id === user.id) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })

  const admin = createAdminClient()

  // Delete from public.users first (cascade will handle related rows)
  await admin.from('users').delete().eq('id', params.id)

  // Delete from Supabase Auth (requires service role)
  const { error } = await admin.auth.admin.deleteUser(params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
