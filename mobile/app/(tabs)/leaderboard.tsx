import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { C } from '@/lib/colors'

const PERIODS = [
  { label: 'Weekly',   value: 'weekly'   },
  { label: 'Monthly',  value: 'monthly'  },
  { label: 'All Time', value: 'alltime'  },
]

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardScreen() {
  const { session } = useAuth()
  const [entries,    setEntries]    = useState<any[]>([])
  const [period,     setPeriod]     = useState('weekly')
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://stark-team.info'
      const res  = await fetch(`${apiUrl}/api/leaderboard/live?period=${period}`)
        .catch(() => null)

      if (res?.ok) {
        const json = await res.json()
        setEntries(json.entries ?? [])
        return
      }
    } catch {}

    // fallback: compute from DB directly
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    let from: string | undefined
    if (period === 'weekly') {
      const s = new Date(now); s.setDate(s.getDate() - s.getDay()); s.setHours(0,0,0,0)
      from = s.toISOString()
    } else if (period === 'monthly') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    }

    let q = supabase.from('activities').select('user_id, users(id, full_name, rank)').eq('status', 'verified')
    if (from) q = q.gte('submitted_at', from)

    const { data } = await q
    if (!data) return

    const scores: Record<string, { id: string; full_name: string; rank: string; score: number }> = {}
    data.forEach((a: any) => {
      const u = a.users
      if (!u) return
      if (!scores[u.id]) scores[u.id] = { id: u.id, full_name: u.full_name, rank: u.rank, score: 0 }
      scores[u.id].score++
    })
    const sorted = Object.values(scores).sort((a, b) => b.score - a.score)
    setEntries(sorted)
  }

  useEffect(() => { load() }, [period])
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false) }

  const myPos = entries.findIndex(e => e.id === session?.user?.id)

  return (
    <View style={s.screen}>
      {/* Period selector */}
      <View style={s.periodBar}>
        {PERIODS.map(p => (
          <TouchableOpacity key={p.value} style={[s.periodBtn, period === p.value && s.periodActive]} onPress={() => setPeriod(p.value)}>
            <Text style={[s.periodText, period === p.value && s.periodTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* My rank banner */}
      {myPos >= 0 && (
        <View style={s.myRankBanner}>
          <Text style={s.myRankText}>Your rank this {period === 'alltime' ? 'time' : period}: </Text>
          <Text style={[s.myRankText, { color: C.gold, fontWeight: '800' }]}>#{myPos + 1}</Text>
        </View>
      )}

      <ScrollView style={s.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}>
        {entries.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyText}>No data yet for this period</Text></View>
        ) : entries.map((e, i) => {
          const isMe = e.id === session?.user?.id
          const topScore = entries[0]?.score ?? 1
          const barPct = topScore > 0 ? (e.score / topScore) * 100 : 0
          return (
            <View key={e.id} style={[s.row, isMe && s.rowMe]}>
              <Text style={s.medal}>{i < 3 ? MEDALS[i] : ''}</Text>
              <Text style={[s.rank, { color: i < 3 ? C.gold : C.mu }]}>#{i + 1}</Text>
              <View style={s.nameCol}>
                <Text style={[s.name, isMe && { color: C.gold }]} numberOfLines={1}>
                  {e.full_name}{isMe ? ' (you)' : ''}
                </Text>
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${barPct}%` as any, backgroundColor: i === 0 ? C.gold : C.navy }]} />
                </View>
              </View>
              <Text style={[s.score, i === 0 && { color: C.gold }]}>{e.score}</Text>
            </View>
          )
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  periodBar:        { flexDirection: 'row', backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.bd, padding: 12, gap: 8 },
  periodBtn:        { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: C.bg, alignItems: 'center' },
  periodActive:     { backgroundColor: C.navy },
  periodText:       { fontSize: 13, fontWeight: '600', color: C.tx2 },
  periodTextActive: { color: '#fff' },

  myRankBanner: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 10, backgroundColor: C.navyL + '20' },
  myRankText:   { fontSize: 13, color: C.tx2 },

  list:      { flex: 1, padding: 16 },
  empty:     { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: C.mu, fontSize: 14 },

  row:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.bd, gap: 10 },
  rowMe:  { borderColor: C.gold, backgroundColor: '#FFFBEB' },
  medal:  { fontSize: 20, width: 28, textAlign: 'center' },
  rank:   { fontSize: 13, fontWeight: '800', width: 30, textAlign: 'center' },
  nameCol:{ flex: 1 },
  name:   { fontSize: 14, fontWeight: '600', color: C.tx, marginBottom: 6 },
  barBg:  { height: 4, backgroundColor: C.bd, borderRadius: 2, overflow: 'hidden' },
  barFill:{ height: '100%', borderRadius: 2 },
  score:  { fontSize: 16, fontWeight: '800', color: C.tx2, minWidth: 36, textAlign: 'right' },
})
