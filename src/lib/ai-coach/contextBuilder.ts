import { createClient } from '@/lib/supabase/server'

export async function buildCoachContext(userId: string, mode: 'member' | 'leader' | 'admin') {
  const supabase = await createClient()

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // User
  const { data: user } = await supabase
    .from('users')
    .select('full_name, rank, role, branch_id, created_at')
    .eq('id', userId)
    .single()

  // Activity stats — last 30 days
  const { data: activities } = await supabase
    .from('activities')
    .select('status, proof_url, submitted_at')
    .eq('user_id', userId)
    .gte('submitted_at', thirtyDaysAgo.toISOString())

  const submitted  = activities?.length ?? 0
  const verified   = activities?.filter(a => a.status === 'verified').length ?? 0
  const rejected   = activities?.filter(a => a.status === 'rejected').length ?? 0
  const pending    = activities?.filter(a => a.status === 'pending').length ?? 0
  const withProof  = activities?.filter(a => a.proof_url).length ?? 0

  const { data: lastActivity } = await supabase
    .from('activities')
    .select('submitted_at')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single()

  const daysSinceLast = lastActivity
    ? Math.floor((now.getTime() - new Date(lastActivity.submitted_at).getTime()) / 86400000)
    : 999

  // Goals
  const { data: goals } = await supabase
    .from('goals')
    .select('status, deadline')
    .eq('user_id', userId)

  const activeGoals    = goals?.filter(g => g.status === 'active').length ?? 0
  const completedGoals = goals?.filter(g => g.status === 'completed').length ?? 0
  const overdueGoals   = goals?.filter(g => g.status === 'active' && new Date(g.deadline) < now).length ?? 0
  const totalFinished  = completedGoals + (goals?.filter(g => g.status === 'failed').length ?? 0)
  const completionRate = totalFinished > 0 ? completedGoals / totalFinished : 0

  // Leaderboard
  const { data: snap } = await supabase
    .from('leaderboard_snapshots')
    .select('rank_position, score')
    .eq('user_id', userId)
    .eq('period', 'monthly')
    .order('snapshot_date', { ascending: false })
    .limit(2)

  const currentPos  = snap?.[0]?.rank_position ?? 0
  const prevPos     = snap?.[1]?.rank_position ?? 0
  const trend: 'rising' | 'stable' | 'declining' =
    currentPos < prevPos ? 'rising' : currentPos > prevPos ? 'declining' : 'stable'

  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Branch context (leaders only)
  let branchCtx = undefined
  if (mode === 'leader' && user?.branch_id) {
    const { data: branchMembers } = await supabase
      .from('users')
      .select('id, last_seen_at')
      .eq('branch_id', user.branch_id)
      .eq('is_active', true)

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const inactive = branchMembers?.filter(m =>
      !m.last_seen_at || new Date(m.last_seen_at) < sevenDaysAgo
    ).length ?? 0

    const { count: queueCount } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .in('user_id', branchMembers?.map(m => m.id) ?? [])

    const { data: branchActivities } = await supabase
      .from('activities')
      .select('status')
      .in('user_id', branchMembers?.map(m => m.id) ?? [])
      .gte('submitted_at', thirtyDaysAgo.toISOString())

    const bTotal    = branchActivities?.length ?? 0
    const bVerified = branchActivities?.filter(a => a.status === 'verified').length ?? 0

    branchCtx = {
      avgVerifiedRate:     bTotal > 0 ? bVerified / bTotal : 0,
      inactiveMemberCount: inactive,
      queueBacklog:        queueCount ?? 0,
    }
  }

  return {
    user: {
      name:          user?.full_name ?? 'Team Member',
      rank:          user?.rank ?? 'distributor',
      daysSinceJoin: Math.floor((now.getTime() - new Date(user?.created_at ?? now).getTime()) / 86400000),
    },
    activity: {
      last30dSubmitted:        submitted,
      last30dVerified:         verified,
      last30dRejected:         rejected,
      last30dPending:          pending,
      daysSinceLastSubmission: daysSinceLast,
      proofIncludedRate:       submitted > 0 ? withProof / submitted : 0,
    },
    goals: {
      active:            activeGoals,
      overdue:           overdueGoals,
      completionRate30d: completionRate,
    },
    leaderboard: {
      currentPosition: currentPos,
      totalUsers:      totalUsers ?? 0,
      trend,
    },
    rankProgress: {
      currentRank:     user?.rank ?? 'distributor',
      nextRank:        null,    // populate from rank_criteria table
      criteriaMissing: [],      // populate from rank_criteria check
    },
    branch: branchCtx,
    mode,
  }
}
