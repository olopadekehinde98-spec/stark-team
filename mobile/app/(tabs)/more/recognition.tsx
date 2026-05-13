import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { supabase } from '@/lib/supabase'
import { C } from '@/lib/colors'

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

export default function RecognitionScreen() {
  const [items,      setItems]      = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('recognition')
      .select('id,message,type,created_at,giver:giver_id(full_name),receiver:receiver_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(30)
    setItems(data ?? [])
  }

  useEffect(() => { load() }, [])
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false) }

  return (
    <ScrollView style={s.screen} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🏅 Recognition Wall</Text>
        <Text style={s.headerSub}>Celebrate your team's wins</Text>
      </View>

      {items.length === 0 ? (
        <View style={s.empty}><Text style={s.emptyText}>No recognitions yet</Text></View>
      ) : items.map(r => (
        <View key={r.id} style={s.card}>
          <View style={s.cardTop}>
            <Text style={s.type}>{r.type === 'shoutout' ? '📣 Shoutout' : r.type === 'milestone' ? '🎯 Milestone' : '🏅 Award'}</Text>
            <Text style={s.time}>{timeAgo(r.created_at)}</Text>
          </View>
          <Text style={s.message}>{r.message}</Text>
          <View style={s.from}>
            <Text style={s.fromText}>
              <Text style={s.fromName}>{(r.giver as any)?.full_name ?? 'Someone'}</Text>
              {' → '}
              <Text style={s.toName}>{(r.receiver as any)?.full_name ?? 'Someone'}</Text>
            </Text>
          </View>
        </View>
      ))}
      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: C.bg },
  header:     { backgroundColor: C.navy, padding: 20, paddingTop: 10 },
  headerTitle:{ fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub:  { fontSize: 13, color: 'rgba(255,255,255,0.55)' },

  empty:     { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: C.mu, fontSize: 14 },

  card:    { backgroundColor: C.white, marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.bd },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  type:    { fontSize: 12, fontWeight: '700', color: C.gold },
  time:    { fontSize: 11, color: C.mu },
  message: { fontSize: 14, color: C.tx, lineHeight: 20, marginBottom: 12 },
  from:    { borderTopWidth: 1, borderTopColor: C.bd, paddingTop: 10 },
  fromText:{ fontSize: 12, color: C.mu },
  fromName:{ color: C.navy, fontWeight: '700' },
  toName:  { color: C.gold, fontWeight: '700' },
})
