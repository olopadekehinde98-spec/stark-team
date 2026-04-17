import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at',{ascending:false})
  return NextResponse.json({ goals: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { title, goal_type, target_metric, deadline, description, category } = body
  if (!title || !goal_type || !target_metric || !deadline) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const { data, error } = await supabase.from('goals').insert({
    user_id: user.id, title, goal_type, target_metric: Number(target_metric), deadline,
    description: description||null, category: category||null,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ goal: data })
}