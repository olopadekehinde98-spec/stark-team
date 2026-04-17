import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data, error } = await supabase.from('verification_records').select('*,verifier:users!verified_by(full_name,rank),activity:activities(title,activity_type)').order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
