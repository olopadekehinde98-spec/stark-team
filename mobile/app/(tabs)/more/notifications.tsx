import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { supabase } from '@/lib/supabase'
import { C } from '@/lib/colors'

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

const ICON: Record<string, string> = {
  activity_verified: '✅', activity_rejected: '❌', recognition: '🏅',
  announcement: '📢', goal_reminder: '🎯', default: '🔔',
}

export default function NotificationsScreen() {
  const [notifs,     setNotifs]     = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifs(data ?? [])

    // Mark all as read
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
  }

  useEffect(() => { load() }, [])
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false) }

  return (
    <ScrollView style={s.screen} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}>
      {notifs.length === 0 ? (
        <View style={s.empty}><Text style={s.emptyText}>No notifications yet</Text></View>
      ) : notifs.map(n => (
        <TouchableOpacity key={n.id} style={[s.row, !n.is_read && s.rowUnread]} activeOpacity={0.8}>
          <View style={[s.iconBox, { backgroundColor: n.is_read ? C.bg : C.blueBg }]}>
            <Text style={s.icon}>{ICON[n.type] ?? ICON.default}</Text>
          </View>
          <View style={s.body}>
            <Text style={[s.title, !n.is_read && { color: C.tx }]}>{n.title ?? n.type?.replace(/_/g, ' ')}</Text>
            {n.body ? <Text style={s.bodyText} numberOfLines={2}>{n.body}</Text> : null}
            <Text style={s.time}>{timeAgo(n.created_at)}</Text>
          </View>
          {!n.is_read && <View style={s.unreadDot} />}
        </TouchableOpacity>
      ))}
      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: C.bg },
  empty:     { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: C.mu, fontSize: 14 },

  row:       { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: C.bd, backgroundColor: C.white, gap: 12 },
  rowUnread: { backgroundColor: '#F0F7FF' },
  iconBox:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  icon:      { fontSize: 20 },
  body:      { flex: 1 },
  title:     { fontSize: 14, fontWeight: '600', color: C.tx2, marginBottom: 2 },
  bodyText:  { fontSize: 13, color: C.tx2, lineHeight: 18, marginBottom: 4 },
  time:      { fontSize: 11, color: C.mu },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.blue, marginTop: 6 },
})
