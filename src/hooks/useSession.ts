'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface SessionUser {
  id: string
  email: string
  profile: {
    full_name: string
    username: string
    role: string
    rank: string
    branch_id: string | null
    avatar_url: string | null
  } | null
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) { setUser(null); setLoading(false); return }
      const { data: profile } = await supabase
        .from('users').select('full_name,username,role,rank,branch_id,avatar_url')
        .eq('id', authUser.id).single()
      setUser({ id: authUser.id, email: authUser.email!, profile: profile ?? null })
      setLoading(false)
    })
  }, [])

  return { user, loading }
}