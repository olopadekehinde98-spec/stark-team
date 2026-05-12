import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase
    .from('activities').select('id,title,activity_type,activity_date,status,submitted_at,proof_url,proof_type,edit_locked_at')
    .eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(50)
  return NextResponse.json({ activities: data })
}

/**
 * POST /api/activities
 * Submit a new activity. If goal_id is provided, marks that goal as
 * 'completed' using the admin client — bypasses RLS so it always works.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    title, description, activity_type, template_id,
    goal_id, activity_date, proof_url, proof_type,
  } = body

  if (!title || !activity_type || !activity_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Goal is required — block submission if none provided
  if (!goal_id) {
    return NextResponse.json({ error: 'You must link this activity to one of your daily goals.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify the goal belongs to this user and is active
  const { data: goal } = await admin
    .from('goals')
    .select('id, status, user_id')
    .eq('id', goal_id)
    .eq('user_id', user.id)
    .single()

  if (!goal) {
    return NextResponse.json({ error: 'Goal not found or does not belong to you.' }, { status: 404 })
  }
  if (goal.status !== 'active') {
    return NextResponse.json({ error: `Cannot submit against a goal with status "${goal.status}". Only active goals can be used.` }, { status: 400 })
  }

  // Insert activity using admin client (bypasses RLS edge cases)
  const { data: activity, error: actErr } = await admin
    .from('activities')
    .insert({
      user_id:       user.id,
      title,
      description:   description || null,
      activity_type,
      template_id:   template_id || null,
      goal_id,
      activity_date,
      proof_url:     proof_url || null,
      proof_type:    proof_type || 'none',
    })
    .select()
    .single()

  if (actErr) return NextResponse.json({ error: actErr.message }, { status: 400 })

  // Mark goal as completed — admin client bypasses RLS
  await admin
    .from('goals')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', goal_id)
    .eq('user_id', user.id)

  return NextResponse.json({ activity })
}
