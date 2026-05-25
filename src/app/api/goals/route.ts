/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at',{ascending:false})
  return NextResponse.json({ goals: data })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check admin goal window override first
    const adminClient = createAdminClient()
    let overrideOpen = false
    try {
      const { data: setting } = await adminClient
        .from('app_settings')
        .select('value')
        .eq('key', 'goal_window_override')
        .single()
      overrideOpen = setting?.value === 'true'
    } catch { /* app_settings table may not exist yet â€” treat as no override */ }

    // Enforce Nigeria time window: 5 AM â€“ 12 PM WAT (UTC+1) â€” skip if override is on
    if (!overrideOpen) {
      const nigeriaHour = new Date(Date.now() + 60 * 60 * 1000).getUTCHours()
      if (nigeriaHour < 5 || nigeriaHour >= 12) {
        return NextResponse.json(
          { error: 'Goals can only be created between 5:00 AM and 12:00 PM Nigeria time (WAT). Please try again during the next window.' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { title, goal_type, target_metric, target_value, deadline, description, category } = body
    const targetVal = target_metric ?? target_value
    if (!title || !goal_type || !targetVal || !deadline) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    const { data, error } = await supabase.from('goals').insert({
      user_id: user.id, title, goal_type, target_metric: Number(targetVal), deadline,
      description: description||null, category: category||null, status: 'pending_approval',
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ goal: data })
  } catch (err: any) {
    console.error('[goals POST]', err)
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 })
  }
}