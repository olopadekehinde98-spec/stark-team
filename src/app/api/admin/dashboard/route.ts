import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const [{ count: members }, { count: activities }, { count: pending }] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('activities').select('*', { count: 'exact', head: true }),
    supabase.from('activities').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  return NextResponse.json({ members, activities, pending })
}
