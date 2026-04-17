'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useActivities(limit = 20) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase.from('activities')
        .select('id,title,activity_type,status,submitted_at,edit_locked_at,proof_url')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(limit)
        .then(({ data }) => { setActivities(data ?? []); setLoading(false) })
    })
  }, [limit])

  return { activities, loading }
}