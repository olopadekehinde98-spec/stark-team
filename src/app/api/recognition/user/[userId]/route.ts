import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params: _params }: { params: Promise<{ userId: string }> }
) {
  const params = await _params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('recognitions').select('*,issuer:users!issued_by(full_name,rank)').eq('recipient_id', params.userId).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
