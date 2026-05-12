import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { C } from '@/lib/colors'

const typeColor: Record<string, string> = { Monthly: C.gold, Weekly: C.warn, Daily: C.blue }

export default function GoalsScreen() {
  const router = useRouter()
  const [goals,      setGoals]      = useState<any[]>([])
  const [tab,        setTab]        = useState<'active' | 'completed'>('active')
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setGoals(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false) }

  const shown = goals.filter(g => tab === 'active' ? g.status === 'active' : g.status === 'completed')

  return (
    <View style={s.screen}>
      {/* Tabs */}
      <View style={s.tabBar}>
        {(['active', 'completed'] as const).map(t => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === 'active' ? 'Active' : 'Completed'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}>
        {shown.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>No {tab} goals</Text>
            {tab === 'active' && (
              <TouchableOpacity style={s.createHint} onPress={() => router.push('/(tabs)/goals/create')}>
                <Text style={s.createHintText}>Create your first goal →</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : shown.map(g => {
          const cur = g.current_metric ?? 0
          const pct = g.target_metric > 0 ? Math.min(100, Math.round((cur / g.target_metric) * 100)) : 0
          const color = typeColor[g.goal_type] ?? C.mu
          return (
            <View key={g.id} style={s.card}>
              <View style={s.cardTop}>
                <View style={[s.typePill, { backgroundColor: color + '18' }]}>
                  <Text style={[s.typeText, { color }]}>{g.goal_type ?? 'Goal'}</Text>
                </View>
                <Text style={s.pct}>{pct}%</Text>
              </View>
              <Text style={s.title}>{g.title}</Text>
              <View style={s.progressBg}>
                <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
              </View>
              <View style={s.cardBottom}>
                <Text style={s.metric}>{cur}/{g.target_metric}</Text>
                {g.deadline && <Text style={s.deadline}>Due {new Date(g.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>}
              </View>
            </View>
          )
        })}
        <View style={{ height: 24 }} />
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={() => router.push('/(tabs)/goals/create')}>
        <Text style={s.fabText}>+ Goal</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  tabBar:        { flexDirection: 'row', backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.bd, paddingHorizontal: 16 },
  tabBtn:        { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:     { borderBottomColor: C.navy },
  tabText:       { fontSize: 14, fontWeight: '600', color: C.mu },
  tabTextActive: { color: C.navy },

  list:  { flex: 1, padding: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText:      { color: C.mu, fontSize: 14, marginBottom: 12 },
  createHint:     { backgroundColor: C.navy, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  createHintText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  card:     { backgroundColor: C.white, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.bd },
  cardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typePill: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  typeText: { fontSize: 11, fontWeight: '700' },
  pct:      { fontSize: 16, fontWeight: '800', color: C.tx },
  title:    { fontSize: 15, fontWeight: '600', color: C.tx, marginBottom: 10 },
  progressBg:   { height: 7, backgroundColor: C.bd, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 4 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  metric:   { fontSize: 12, color: C.tx2, fontWeight: '600' },
  deadline: { fontSize: 12, color: C.mu },

  fab:     { position: 'absolute', right: 20, bottom: 24, backgroundColor: C.navy, borderRadius: 28, paddingHorizontal: 24, paddingVertical: 14, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 14 },
})
