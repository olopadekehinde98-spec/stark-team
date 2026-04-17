import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { canVerify } from '@/lib/verification/canVerify'
import { writeAuditLog } from '@/lib/utils/auditLog'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params: _params }: { params: Promise<{ activityId: string }> }
) {
  const params = await _params
  const supabase      = createClient()
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: verifier } = await adminSupabase
    .from('users')
    .select('role, rank, branch_id')
    .eq('id', user.id)
    .single()

  if (!verifier) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: activity } = await adminSupabase
    .from('activities')
    .select('id, status, user_id, users!inner(rank, branch_id)')
    .eq('id', params.activityId)
    .single()

  if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
  if (activity.status !== 'pending') {
    return NextResponse.json({ error: 'Activity is not in pending status' }, { status: 400 })
  }

  const target = activity.users as any

  const check = canVerify({
    verifierRole:     verifier.role,
    verifierRank:     verifier.rank,
    verifierBranchId: verifier.branch_id,
    targetRank:       target.rank,
    targetBranchId:   target.branch_id,
  })

  if (!check.allowed) {
    return NextResponse.json({ error: check.reason }, { status: 403 })
  }

  await adminSupabase
    .from('activities')
    .update({ status: 'verified', updated_at: new Date().toISOString() })
    .eq('id', params.activityId)

  const body = await request.json().catch(() => ({}))
  await adminSupabase.from('verification_records').insert({
    activity_id: params.activityId,
    verified_by: user.id,
    action:      'verified',
    notes:       body.notes ?? null,
  })

  const ip = request.headers.get('x-forwarded-for') ?? undefined
  await writeAuditLog({
    actorId:    user.id,
    action:     'verify_activity',
    targetType: 'activity',
    targetId:   params.activityId,
    metadata:   { target_user_id: activity.user_id },
    ipAddress:  ip,
  })

  await adminSupabase.from('notifications').insert({
    user_id:        activity.user_id,
    type:           'activity_verified',
    title:          'Activity Verified',
    body:           'One of your submitted activities has been verified.',
    reference_id:   params.activityId,
    reference_type: 'activity',
  })

  return NextResponse.json({ success: true })
}
