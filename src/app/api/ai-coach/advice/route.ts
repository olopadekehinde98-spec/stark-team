import { createClient } from '@/lib/supabase/server'
import { buildCoachContext } from '@/lib/ai-coach/contextBuilder'
import { runRuleEngine } from '@/lib/ai-coach/ruleEngine'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const mode = profile?.role === 'admin' ? 'admin' : profile?.role === 'leader' ? 'leader' : 'member'
  const context = await buildCoachContext(user.id, mode)
  const tip = runRuleEngine(context)

  return NextResponse.json({
    tip,
    context_summary: {
      last30dVerified:  context.activity.last30dVerified,
      last30dSubmitted: context.activity.last30dSubmitted,
      goalsActive:      context.goals.active,
      leaderboardTrend: context.leaderboard.trend,
    },
  })
}
