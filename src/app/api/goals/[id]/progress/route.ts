import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { progress } = await req.json()
  if (typeof progress !== 'number' || progress < 0 || progress > 100) {
    return NextResponse.json({ error: 'Progress must be 0-100' }, { status: 400 })
  }
  const updates: Record<string, unknown> = { progress_pct: progress }
  if (progress >= 100) updates.status = 'completed'
  const { data, error } = await supabase.from('goals').update(updates).eq('id', params.id).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
