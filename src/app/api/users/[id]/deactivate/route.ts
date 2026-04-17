import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const { error } = await admin.from('users').update({ is_active: false }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
