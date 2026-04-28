import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function periodRange(period: string): { gte: string } | null {
  const now = new Date()
  if (period === 'daily') {
    const start = new Date(now); start.setHours(0, 0, 0, 0)
    return { gte: start.toISOString() }
  }
  if (period === 'weekly') {
    const start = new Date(now)
    start.setDate(start.getDate() - start.getDay()) // Sunday
    start.setHours(0, 0, 0, 0)
    return { gte: start.toISOString() }
  }
  if (period === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { gte: start.toISOString() }
  }
  return null // all time
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') ?? 'weekly'

  const admin = createAdminClient()

  // Get weights
  const { data: wData } = await admin.from('leaderboard_weights').select('*').limit(1).single()
  const vW  = wData?.verified_weight   ?? 1.0
  const uvW = wData?.unverified_weight ?? 0.2

  // Get all active users
  const { data: users } = await admin
    .from('users')
    .select('id,full_name,rank,avatar_url,username')
    .eq('is_active', true)

  if (!users?.length) return NextResponse.json({ entries: [] })

  // Build date filter
  const range = periodRange(period)

  // Get all activities in period
  let query = admin.from('activities').select('user_id,status')
  if (range) query = query.gte('submitted_at', range.gte)
  const { data: acts } = await query

  // Calculate scores per user
  const scoreMap: Record<string, number> = {}
  for (const a of (acts ?? [])) {
    if (!scoreMap[a.user_id]) scoreMap[a.user_id] = 0
    if (a.status === 'verified')   scoreMap[a.user_id] += vW
    if (a.status === 'unverified') scoreMap[a.user_id] += uvW
    // rejected = 0 points
  }

  // Build sorted entries
  const entries = users
    .map(u => ({ ...u, score: Math.round((scoreMap[u.id] ?? 0) * 10) / 10 }))
    .sort((a, b) => b.score - a.score)
    .map((u, i) => ({ ...u, rank_position: i + 1 }))

  return NextResponse.json({ entries, period })
}
