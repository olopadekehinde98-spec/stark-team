import { calculateAndSnapshotLeaderboard } from '@/lib/leaderboard/scoreCalculator'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await calculateAndSnapshotLeaderboard('daily')
  await calculateAndSnapshotLeaderboard('weekly')
  await calculateAndSnapshotLeaderboard('monthly')
  await calculateAndSnapshotLeaderboard('alltime')

  return NextResponse.json({ success: true, timestamp: new Date().toISOString() })
}
