import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { C } from '@/lib/colors'

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function fmtRank(rank?: string) {
  if (!rank) return 'Member'
  const map: Record<string, string> = {
    e_member: 'E-Member', distributor: 'Distributor', manager: 'Manager',
    senior_manager: 'Senior Manager', executive_manager: 'Executive', director: 'Director',
  }
  return map[rank] ?? rank.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function Dashboard() {
  const { profile } = useAuth()
  const router = useRouter()
  const [data,       setData]       = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const [actsRes, goalsRes, recentRes] = await Promise.all([
      supabase.from('activities').select('status').eq('user_id', user.id),
      supabase.from('goals').select('title,status,target_metric,current_metric,goal_type,deadline').eq('user_id', user.id).eq('status', 'active').limit(3),
      supabase.from('activities').select('id,title,activity_type,status,submitted_at').eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(5),
    ])

    const acts     = actsRes.data ?? []
    const verified = acts.filter((a: any) => a.status === 'verified').length
    const pending  = acts.filter((a: any) => a.status === 'pending').length
    const rate     = acts.length > 0 ? Math.round((verified / acts.length) * 100) : 0

    setData({ total: acts.length, verified, pending, rate, goals: goalsRes.data ?? [], recent: recentRes.data ?? [] })
  }

  useEffect(() => { load() }, [])

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false) }

  const name      = profile?.full_name?.split(' ')[0] ?? 'there'
  const roleLabel = (profile?.role ?? 'member').replace(/\b\w/g, (c: string) => c.toUpperCase())
  const today     = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const stats = data ? [
    { icon: '📊', label: 'Activities',  value: data.total,    sub: `${data.verified} verified`,  color: C.ok   },
    { icon: '⚡', label: 'Verified',    value: `${data.rate}%`, sub: 'Target: 60%+',             color: data.rate >= 60 ? C.ok : C.warn },
    { icon: '⏳', label: 'Pending',     value: data.pending,  sub: 'Awaiting review',            color: data.pending > 0 ? C.err : C.ok },
  ] : []

  return (
    <ScrollView style={s.screen} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.greeting}>{greeting()}, {name} 👋</Text>
        <Text style={s.sub}>{roleLabel}  ·  {today}</Text>
      </View>

      {/* Stats */}
      {data && (
        <View style={s.statsRow}>
          {stats.map((st, i) => (
            <View key={i} style={s.statCard}>
              <Text style={s.statIcon}>{st.icon}</Text>
              <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
              <Text style={s.statSub}>{st.sub}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Quick actions */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => router.push('/(tabs)/activities/submit')}>
          <Text style={s.primaryBtnText}>+ Submit Activity</Text>
        </TouchableOpacity>
        <View style={s.btnRow}>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => router.push('/(tabs)/goals/create')}>
            <Text style={s.secondaryBtnText}>+ Create Goal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => router.push('/(tabs)/leaderboard')}>
            <Text style={s.secondaryBtnText}>Leaderboard</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activities */}
      {data && data.recent.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Activities</Text>
          <View style={s.card}>
            {data.recent.map((a: any, i: number) => (
              <View key={a.id} style={[s.actRow, i < data.recent.length - 1 && s.actBorder]}>
                <View style={[s.dot, { backgroundColor: a.status === 'verified' ? C.ok : a.status === 'pending' ? C.blue : C.err }]} />
                <Text style={s.actTitle} numberOfLines={1}>{a.title}</Text>
                <Text style={s.actTime}>{timeAgo(a.submitted_at)}</Text>
                <View style={[s.statusBadge, { backgroundColor: a.status === 'verified' ? C.okBg : a.status === 'pending' ? C.blueBg : C.errBg }]}>
                  <Text style={[s.statusText, { color: a.status === 'verified' ? C.ok : a.status === 'pending' ? C.blue : C.err }]}>
                    {a.status === 'verified' ? 'Verified' : a.status === 'pending' ? 'Pending' : 'Rejected'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Active Goals */}
      {data && data.goals.length > 0 && (
        <View style={[s.section, { paddingBottom: 32 }]}>
          <Text style={s.sectionTitle}>Active Goals</Text>
          <View style={s.card}>
            {data.goals.map((g: any, i: number) => {
              const pct = g.target_metric > 0 ? Math.min(100, Math.round(((g.current_metric ?? 0) / g.target_metric) * 100)) : 0
              return (
                <View key={i} style={[i < data.goals.length - 1 && s.actBorder, { paddingVertical: 14 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={[s.actTitle, { flex: 1 }]} numberOfLines={1}>{g.title}</Text>
                    <Text style={{ color: C.gold, fontWeight: '700', fontSize: 13 }}>{pct}%</Text>
                  </View>
                  <View style={s.progressBg}>
                    <View style={[s.progressFill, { width: `${pct}%` as any }]} />
                  </View>
                  <Text style={s.actTime}>{g.current_metric ?? 0}/{g.target_metric}  ·  {g.goal_type}</Text>
                </View>
              )
            })}
          </View>
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: C.bg },
  header:  { backgroundColor: C.navy, padding: 20, paddingTop: 10 },
  greeting:{ fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  sub:     { fontSize: 13, color: 'rgba(255,255,255,0.55)' },

  statsRow:  { flexDirection: 'row', padding: 16, gap: 10 },
  statCard:  { flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.bd },
  statIcon:  { fontSize: 20, marginBottom: 6 },
  statVal:   { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '700', color: C.tx2, letterSpacing: 0.5 },
  statSub:   { fontSize: 9, color: C.mu, marginTop: 2 },

  section:       { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle:  { fontSize: 14, fontWeight: '700', color: C.tx, marginBottom: 12 },
  card:          { backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: C.bd },

  primaryBtn:      { backgroundColor: C.navy, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  primaryBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnRow:          { flexDirection: 'row', gap: 10 },
  secondaryBtn:    { flex: 1, backgroundColor: C.white, borderWidth: 1, borderColor: C.bd, borderRadius: 10, padding: 14, alignItems: 'center' },
  secondaryBtnText:{ color: C.tx2, fontWeight: '600', fontSize: 13 },

  actRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  actBorder: { borderBottomWidth: 1, borderBottomColor: C.bd },
  dot:       { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  actTitle:  { flex: 1, fontSize: 13, fontWeight: '500', color: C.tx },
  actTime:   { fontSize: 11, color: C.mu, marginTop: 4 },
  statusBadge:  { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  statusText:   { fontSize: 10, fontWeight: '600' },

  progressBg:   { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden', marginVertical: 6 },
  progressFill: { height: '100%', backgroundColor: C.gold, borderRadius: 3 },
})
