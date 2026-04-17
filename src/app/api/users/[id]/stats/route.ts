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
  const { data: activities } = await supabase.from('activities').select('status').eq('user_id', params.id)
  const total = activities?.length ?? 0
  const verified = activities?.filter((a: any) => a.status === 'verified').length ?? 0
  const pending = activities?.filter((a: any) => a.status === 'pending').length ?? 0
  const rejected = activities?.filter((a: any) => a.status === 'rejected').length ?? 0
  return NextResponse.json({ total, verified, pending, rejected })
}
