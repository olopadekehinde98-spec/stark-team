import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl, TextInput } from 'react-native'
import { supabase } from '@/lib/supabase'
import { C } from '@/lib/colors'

function fmtRank(rank?: string) {
  if (!rank) return 'Member'
  const map: Record<string, string> = {
    e_member: 'E-Member', distributor: 'Distributor', manager: 'Manager',
    senior_manager: 'Senior Manager', executive_manager: 'Executive', director: 'Director',
  }
  return map[rank] ?? rank.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const rankOrder = ['director','executive_manager','senior_manager','manager','distributor','e_member']

export default function TeamScreen() {
  const [members,    setMembers]    = useState<any[]>([])
  const [search,     setSearch]     = useState('')
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    const { data } = await supabase.from('users').select('id,full_name,rank,role,avatar_url').order('full_name')
    setMembers(data ?? [])
  }

  useEffect(() => { load() }, [])
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false) }

  const shown = members
    .filter(m => !search || m.full_name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank))

  return (
    <View style={s.screen}>
      <View style={s.searchBar}>
        <TextInput style={s.searchInput} placeholder="🔍  Search members..." placeholderTextColor={C.mu} value={search} onChangeText={setSearch} />
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}>
        <Text style={s.count}>{shown.length} member{shown.length !== 1 ? 's' : ''}</Text>
        {shown.map(m => {
          const initials = m.full_name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) ?? '?'
          return (
            <View key={m.id} style={s.row}>
              <View style={[s.avatar, m.role === 'admin' && { backgroundColor: C.gold }]}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              <View style={s.info}>
                <View style={s.nameRow}>
                  <Text style={s.name}>{m.full_name}</Text>
                  {m.role === 'admin' && <View style={s.adminBadge}><Text style={s.adminText}>Admin</Text></View>}
                  {m.role === 'leader' && <View style={s.leaderBadge}><Text style={s.leaderText}>Leader</Text></View>}
                </View>
                <Text style={s.rank}>{fmtRank(m.rank)}</Text>
              </View>
            </View>
          )
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: C.bg },
  searchBar: { padding: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.bd },
  searchInput:{ backgroundColor: C.bg, borderRadius: 10, padding: 12, fontSize: 14, color: C.tx },
  count:     { fontSize: 12, color: C.mu, fontWeight: '600', padding: 16, paddingBottom: 8 },

  row:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.bd, gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  info:    { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  name:    { fontSize: 15, fontWeight: '600', color: C.tx },
  rank:    { fontSize: 12, color: C.mu },
  adminBadge:  { backgroundColor: C.gold + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  adminText:   { fontSize: 10, fontWeight: '700', color: C.gold },
  leaderBadge: { backgroundColor: C.blue + '18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  leaderText:  { fontSize: 10, fontWeight: '700', color: C.blue },
})
