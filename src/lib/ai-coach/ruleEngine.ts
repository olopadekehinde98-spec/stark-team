export interface CoachContext {
  user: {
    name: string
    rank: string
    daysSinceJoin: number
  }
  activity: {
    last30dSubmitted: number
    last30dVerified: number
    last30dRejected: number
    last30dPending: number
    daysSinceLastSubmission: number
    proofIncludedRate: number
  }
  goals: {
    active: number
    overdue: number
    completionRate30d: number
  }
  leaderboard: {
    currentPosition: number
    totalUsers: number
    trend: 'rising' | 'stable' | 'declining'
  }
  rankProgress: {
    currentRank: string
    nextRank: string | null
    criteriaMissing: string[]
  }
  branch?: {
    avgVerifiedRate: number
    inactiveMemberCount: number
    queueBacklog: number
  }
  mode: 'member' | 'leader' | 'admin'
}

export interface CoachTip {
  priority: 'high' | 'medium' | 'low'
  category: string
  message: string
  action: string
}

export function runRuleEngine(ctx: CoachContext): CoachTip {
  const { activity, goals, leaderboard, rankProgress, branch, mode } = ctx

  // ── LEADER RULES ──────────────────────────────────────────
  if (mode === 'leader' && branch) {
    if (branch.queueBacklog > 10) {
      return {
        priority: 'high',
        category: 'Verification Backlog',
        message: `You have ${branch.queueBacklog} pending activities in your queue.`,
        action: "Process your verification queue — a backlog delays your team's leaderboard scores.",
      }
    }
    if (branch.inactiveMemberCount > 0) {
      return {
        priority: 'medium',
        category: 'Team Inactivity',
        message: `${branch.inactiveMemberCount} member(s) in your branch haven't submitted in 7+ days.`,
        action: 'Reach out directly. Inactivity clusters pull down your branch performance metrics.',
      }
    }
    if (branch.avgVerifiedRate < 0.5) {
      return {
        priority: 'medium',
        category: 'Branch Verification Rate',
        message: 'Your branch verification rate is below 50%.',
        action: 'Either process the queue more consistently or coach members on proof quality.',
      }
    }
  }

  // ── MEMBER RULES ──────────────────────────────────────────
  if (activity.daysSinceLastSubmission > 7) {
    return {
      priority: 'high',
      category: 'Inactivity',
      message: `No activity submitted in ${activity.daysSinceLastSubmission} days.`,
      action: 'Submit an activity today. Gaps in your record lower your leaderboard position and flag you as inactive to your leader.',
    }
  }

  if (activity.last30dRejected >= 2) {
    return {
      priority: 'high',
      category: 'Rejection Pattern',
      message: `${activity.last30dRejected} activities rejected in the last 30 days.`,
      action: 'Review the rejection reasons on each activity and improve your proof quality before submitting more.',
    }
  }

  if (activity.last30dPending > 5) {
    return {
      priority: 'medium',
      category: 'Pending Backlog',
      message: `You have ${activity.last30dPending} activities pending verification.`,
      action: 'Check whether your submissions include proper proof. Poor proof is the most common cause of ignored queue items.',
    }
  }

  if (goals.overdue > 0) {
    return {
      priority: 'medium',
      category: 'Overdue Goals',
      message: `${goals.overdue} goal(s) are past their deadline.`,
      action: 'Archive goals you can no longer complete, then create realistic replacements with achievable timelines.',
    }
  }

  if (goals.completionRate30d < 0.3) {
    return {
      priority: 'medium',
      category: 'Goal Completion',
      message: `Goal completion rate is ${Math.round(goals.completionRate30d * 100)}% this month.`,
      action: 'Set fewer, more specific goals. Quantity without completion damages your performance record.',
    }
  }

  if (leaderboard.trend === 'declining') {
    return {
      priority: 'medium',
      category: 'Leaderboard Trend',
      message: 'Your leaderboard rank is declining.',
      action: 'Focus on verified submissions, not volume. One verified activity is worth 5 unverified ones under current scoring.',
    }
  }

  if (rankProgress.criteriaMissing.length > 0) {
    return {
      priority: 'low',
      category: 'Rank Progress',
      message: `You're eligible for rank review but missing: ${rankProgress.criteriaMissing.join(', ')}.`,
      action: 'Focus on these specific criteria to qualify for your next rank advancement.',
    }
  }

  if (activity.proofIncludedRate < 0.5) {
    return {
      priority: 'low',
      category: 'Proof Quality',
      message: `Only ${Math.round(activity.proofIncludedRate * 100)}% of your activities include proof.`,
      action: 'Start attaching proof to every submission. Verified activities are what actually count on the leaderboard.',
    }
  }

  // Default — healthy state
  return {
    priority: 'low',
    category: 'Status',
    message: 'Your record looks healthy this week.',
    action: 'Keep your submission frequency consistent and ensure all proof is attached.',
  }
}
