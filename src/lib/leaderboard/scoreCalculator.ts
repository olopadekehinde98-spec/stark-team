import { createAdminClient } from '@/lib/supabase/admin'

export async function calculateAndSnapshotLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'alltime') {
  const supabase = createAdminClient()
  const now      = new Date()

  const { data: weights } = await supabase
    .from('leaderboard_weights')
    .select('verified_weight, unverified_weight, rejected_weight')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  const vw = weights?.verified_weight   ?? 1.0
  const uw = weights?.unverified_weight ?? 0.2
  const rw = weights?.rejected_weight   ?? 0.0

  const ranges: Record<string, Date | null> = {
    daily:   new Date(now.getTime() - 24 * 60 * 60 * 1000),
    weekly:  new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000),
    monthly: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    alltime: null,
  }
  const since = ranges[period]

  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('is_active', true)

  if (!users) return

  const scores: Array<{ userId: string; score: number }> = []

  for (const u of users) {
    let query = supabase
      .from('activities')
      .select('status')
      .eq('user_id', u.id)

    if (since) query = query.gte('submitted_at', since.toISOString())

    const { data: acts } = await query
    if (!acts) { scores.push({ userId: u.id, score: 0 }); continue }

    const verified   = acts.filter(a => a.status === 'verified').length
    const unverified = acts.filter(a => a.status === 'unverified').length
    const rejected   = acts.filter(a => a.status === 'rejected').length

    const score = verified * vw + unverified * uw + rejected * rw
    scores.push({ userId: u.id, score })
  }

  scores.sort((a, b) => b.score - a.score)
  const todayStr = now.toISOString().split('T')[0]

  for (let i = 0; i < scores.length; i++) {
    const s = scores[i]
    await supabase.from('leaderboard_snapshots').upsert({
      user_id:       s.userId,
      snapshot_date: todayStr,
      score:         s.score,
      rank_position: i + 1,
      period,
    }, { onConflict: 'user_id,snapshot_date,period' })
  }
}
