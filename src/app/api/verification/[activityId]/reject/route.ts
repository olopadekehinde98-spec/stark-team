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
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  if (!body.rejection_reason || typeof body.rejection_reason !== 'string') {
    return NextResponse.json({ error: 'rejection_reason is required' }, { status: 400 })
  }

  const { data: verifier } = await adminSupabase
    .from('users')
    .select('role, rank, branch_id')
    .eq('id', user.id)
    .single()

  if (!verifier) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: activity } = await adminSupabase
    .from('activities')
    .select('id, status, user_id, users!inner(rank, branch_id, invited_by)')
    .eq('id', params.activityId)
    .single()

  if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
  if (activity.status !== 'pending') {
    return NextResponse.json({ error: 'Activity is not in pending status' }, { status: 400 })
  }

  const target = activity.users as any

  // Resolve invited_by rank for senior manager protection
  let invitedByRank: string | null = null
  if (target.invited_by) {
    const { data: inviter } = await adminSupabase
      .from('users').select('rank').eq('id', target.invited_by).single()
    invitedByRank = inviter?.rank ?? null
  }

  const check = canVerify({
    verifierRole:         verifier.role,
    verifierRank:         verifier.rank,
    verifierId:           user.id,
    verifierBranchId:     verifier.branch_id,
    targetRank:           target.rank,
    targetBranchId:       target.branch_id,
    targetInvitedById:    target.invited_by ?? null,
    targetInvitedByRank:  invitedByRank,
  })

  if (!check.allowed) {
    return NextResponse.json({ error: check.reason }, { status: 403 })
  }

  await adminSupabase
    .from('activities')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', params.activityId)

  await adminSupabase.from('verification_records').insert({
    activity_id:      params.activityId,
    verified_by:      user.id,
    action:           'rejected',
    rejection_reason: body.rejection_reason,
    notes:            body.notes ?? null,
  })

  const ip = request.headers.get('x-forwarded-for') ?? undefined
  await writeAuditLog({
    actorId:    user.id,
    action:     'reject_activity',
    targetType: 'activity',
    targetId:   params.activityId,
    metadata:   { target_user_id: activity.user_id, reason: body.rejection_reason },
    ipAddress:  ip,
  })

  await adminSupabase.from('notifications').insert({
    user_id:        activity.user_id,
    type:           'activity_rejected',
    title:          'Activity Rejected',
    body:           `Your activity was rejected. Reason: ${body.rejection_reason}`,
    reference_id:   params.activityId,
    reference_type: 'activity',
  })

  return NextResponse.json({ success: true })
}
