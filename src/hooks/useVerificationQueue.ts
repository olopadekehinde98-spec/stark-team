'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useVerificationQueue() {
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      const { data: profile } = await supabase.from('users').select('branch_id,role').eq('id',user.id).single()
      if (!profile?.branch_id) { setLoading(false); return }
      const { data: members } = await supabase.from('users').select('id').eq('branch_id',profile.branch_id)
      const ids = members?.map(m=>m.id)??[]
      if (!ids.length) { setLoading(false); return }
      supabase.from('activities')
        .select('id,title,activity_type,submitted_at,proof_url,users!inner(full_name,rank)')
        .eq('status','pending').in('user_id',ids).order('submitted_at',{ascending:true}).limit(50)
        .then(({ data }) => { setQueue(data??[]); setLoading(false) })
    })
  }, [])

  return { queue, loading }
}