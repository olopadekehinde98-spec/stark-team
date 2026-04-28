import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Admin-only: can reject any activity regardless of current status (overrides leader verify)
export async function POST(
  request: Request,
  { params: _params }: { params: Promise<{ activityId: string }> }
) {
  const params  = await _params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const reason = body.rejection_reason || body.reason || 'Rejected by admin'

  const admin = createAdminClient()

  const { data: activity } = await admin
    .from('activities').select('id,status,user_id').eq('id', params.activityId).single()
  if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 })

  await admin.from('activities')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', params.activityId)

  await admin.from('verification_records').insert({
    activity_id:      params.activityId,
    verified_by:      user.id,
    action:           'rejected',
    rejection_reason: reason,
    notes:            `Admin override — previous status: ${activity.status}`,
  })

  await admin.from('notifications').insert({
    user_id:        activity.user_id,
    type:           'activity_rejected',
    title:          'Activity Rejected by Admin',
    body:           `An admin overrode the verification of your activity. Reason: ${reason}`,
    reference_id:   params.activityId,
    reference_type: 'activity',
  })

  return NextResponse.json({ success: true })
}
