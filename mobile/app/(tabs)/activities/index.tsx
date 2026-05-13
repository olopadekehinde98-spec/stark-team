import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { C } from '@/lib/colors'

const FILTERS = ['All', 'Pending', 'Verified', 'Rejected']

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

export default function ActivitiesScreen() {
  const router = useRouter()
  const [activities, setActivities] = useState<any[]>([])
  const [filter,     setFilter]     = useState('All')
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('activities')
      .select('id,title,activity_type,status,submitted_at,description')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
    setActivities(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false) }

  const shown = activities.filter(a =>
    filter === 'All' ? true : a.status === filter.toLowerCase()
  )

  return (
    <View style={s.screen}>
      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar} contentContainerStyle={s.filterContent}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={s.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}>
        {shown.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyText}>No activities yet</Text></View>
        ) : shown.map(a => (
          <View key={a.id} style={s.card}>
            <View style={s.cardTop}>
              <View style={[s.typeBadge, { backgroundColor: C.navy + '18' }]}>
                <Text style={[s.typeText, { color: C.navy }]}>{a.activity_type}</Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: a.status === 'verified' ? C.okBg : a.status === 'pending' ? C.blueBg : C.errBg }]}>
                <Text style={[s.statusText, { color: a.status === 'verified' ? C.ok : a.status === 'pending' ? C.blue : C.err }]}>
                  {a.status === 'verified' ? '✓ Verified' : a.status === 'pending' ? '· Pending' : '✗ Rejected'}
                </Text>
              </View>
            </View>
            <Text style={s.title}>{a.title}</Text>
            {a.description ? <Text style={s.desc} numberOfLines={2}>{a.description}</Text> : null}
            <Text style={s.time}>{timeAgo(a.submitted_at)}</Text>
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={() => router.push('/(tabs)/activities/submit')}>
        <Text style={s.fabText}>+ Submit</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  filterBar:     { flexGrow: 0, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.bd },
  filterContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: 'row' },
  filterBtn:     { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.bd },
  filterActive:  { backgroundColor: C.navy, borderColor: C.navy },
  filterText:    { fontSize: 13, fontWeight: '600', color: C.tx2 },
  filterTextActive: { color: '#fff' },

  list:  { flex: 1, padding: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: C.mu, fontSize: 14 },

  card:    { backgroundColor: C.white, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.bd },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  typeBadge:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeText:    { fontSize: 11, fontWeight: '700' },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:  { fontSize: 11, fontWeight: '600' },
  title:   { fontSize: 15, fontWeight: '600', color: C.tx, marginBottom: 4 },
  desc:    { fontSize: 13, color: C.tx2, lineHeight: 18, marginBottom: 6 },
  time:    { fontSize: 11, color: C.mu },

  fab:     { position: 'absolute', right: 20, bottom: 24, backgroundColor: C.navy, borderRadius: 28, paddingHorizontal: 24, paddingVertical: 14, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 14 },
})
