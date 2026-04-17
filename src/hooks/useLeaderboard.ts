'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useLeaderboard(period = 'monthly') {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    supabase.from('leaderboard_snapshots')
      .select('user_id,score,rank_position')
      .eq('period', period)
      .eq('snapshot_date', today)
      .order('rank_position', { ascending: true })
      .limit(50)
      .then(({ data }) => { setEntries(data ?? []); setLoading(false) })
  }, [period])

  return { entries, loading }
}