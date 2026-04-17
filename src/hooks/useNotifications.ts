'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase.from('notifications')
        .select('id,type,title,body,created_at,is_read')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }) => {
          setNotifications(data ?? [])
          setUnreadCount(data?.filter(n=>!n.is_read).length ?? 0)
          setLoading(false)
        })
    })
  }, [])

  return { notifications, unreadCount, loading }
}