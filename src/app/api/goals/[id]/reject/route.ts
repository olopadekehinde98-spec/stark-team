import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { canVerify } from '@/lib/verification/canVerify'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params      = await _params
  const supabase    = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (!body.rejection_reason || typeof body.rejection_reason !== 'string') {
    return NextResponse.json({ error: 'rejection_reason is required' }, { status: 400 })
  }

  const { data: approver } = await adminClient
    .from('users').select('role, rank, branch_id').eq('id', user.id).single()
  if (!approver) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: goal } = await adminClient
    .from('goals')
    .select('id, status, user_id, users!inner(rank, branch_id, invited_by)')
    .eq('id', params.id)
    .single()
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  if (goal.status !== 'pending_approval') {
    return NextResponse.json({ error: 'Goal is not pending approval' }, { status: 400 })
  }

  const target = goal.users as any

  let invitedByRank: string | null = null
  if (target.invited_by) {
    const { data: inviter } = await adminClient
      .from('users').select('rank').eq('id', target.invited_by).single()
    invitedByRank = inviter?.rank ?? null
  }

  const check = canVerify({
    verifierRole:        approver.role,
    verifierRank:        approver.rank,
    verifierId:          user.id,
    verifierBranchId:    approver.branch_id,
    targetRank:          target.rank,
    targetBranchId:      target.branch_id,
    targetInvitedById:   target.invited_by ?? null,
    targetInvitedByRank: invitedByRank,
  })
  if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 })

  await adminClient
    .from('goals')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', params.id)

  await adminClient.from('notifications').insert({
    user_id:        goal.user_id,
    type:           'goal_rejected',
    title:          'Goal Rejected',
    body:           `Your goal was rejected. Reason: ${body.rejection_reason}`,
    reference_id:   params.id,
    reference_type: 'goal',
  })

  return NextResponse.json({ success: true })
}
