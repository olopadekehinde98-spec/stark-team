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
  const { data: members, error } = await supabase.from('users').select('id,full_name,username,rank,role,is_active').eq('branch_id', params.id).eq('is_active', true).order('rank')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(members)
}
