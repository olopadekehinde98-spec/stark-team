'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useGoals() {
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase.from('goals')
        .select('id,title,goal_type,target_metric,current_metric,deadline,status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => { setGoals(data ?? []); setLoading(false) })
    })
  }, [])

  return { goals, loading }
}