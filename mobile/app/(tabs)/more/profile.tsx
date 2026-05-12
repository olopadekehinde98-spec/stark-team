import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useAuth } from '@/lib/auth'
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

export default function ProfileScreen() {
  const { profile } = useAuth()
  const [phone,    setPhone]   = useState('')
  const [bio,      setBio]     = useState('')
  const [loading,  setLoading] = useState(false)
  const [stats,    setStats]   = useState<any>(null)

  useEffect(() => {
    if (profile) {
      setPhone((profile as any).phone ?? '')
      setBio((profile as any).bio ?? '')
    }

    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('activities').select('status').eq('user_id', user.id)
      if (!data) return
      const verified = data.filter((a: any) => a.status === 'verified').length
      setStats({ total: data.length, verified, rate: data.length > 0 ? Math.round((verified / data.length) * 100) : 0 })
    }
    loadStats()
  }, [profile])

  async function save() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setLoading(true)
    const { error } = await supabase.from('users').update({ phone: phone.trim() || null, bio: bio.trim() || null }).eq('id', user.id)
    setLoading(false)
    if (error) Alert.alert('Error', error.message)
    else Alert.alert('Saved', 'Profile updated.')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <ScrollView style={s.screen}>
      {/* Avatar */}
      <View style={s.top}>
        <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
        <Text style={s.name}>{profile?.full_name ?? '…'}</Text>
        <Text style={s.rank}>{fmtRank(profile?.rank)}</Text>
      </View>

      {/* Stats */}
      {stats && (
        <View style={s.statsRow}>
          {[
            { label: 'Activities', value: stats.total    },
            { label: 'Verified',   value: stats.verified },
            { label: 'Rate',       value: `${stats.rate}%` },
          ].map((st, i) => (
            <View key={i} style={s.statBox}>
              <Text style={s.statVal}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Editable fields */}
      <View style={s.form}>
        <Text style={s.label}>FULL NAME</Text>
        <View style={s.readOnly}><Text style={s.readOnlyText}>{profile?.full_name}</Text></View>

        <Text style={[s.label, { marginTop: 16 }]}>ROLE</Text>
        <View style={s.readOnly}><Text style={s.readOnlyText}>{(profile?.role ?? 'member').replace(/\b\w/g, c => c.toUpperCase())}</Text></View>

        <Text style={[s.label, { marginTop: 16 }]}>PHONE</Text>
        <TextInput style={s.input} placeholder="+234 800 000 0000" placeholderTextColor={C.mu} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Text style={[s.label, { marginTop: 16 }]}>BIO</Text>
        <TextInput style={[s.input, s.textarea]} placeholder="Tell your team about yourself..." placeholderTextColor={C.mu} value={bio} onChangeText={setBio} multiline numberOfLines={3} textAlignVertical="top" />

        <TouchableOpacity style={s.saveBtn} onPress={save} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: C.bg },
  top:     { backgroundColor: C.navy, alignItems: 'center', paddingVertical: 28, paddingBottom: 32 },
  avatar:  { width: 80, height: 80, borderRadius: 40, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '800', color: C.navy },
  name:    { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  rank:    { fontSize: 13, color: 'rgba(255,255,255,0.55)' },

  statsRow: { flexDirection: 'row', backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.bd },
  statBox:  { flex: 1, alignItems: 'center', paddingVertical: 16, borderRightWidth: 1, borderRightColor: C.bd },
  statVal:  { fontSize: 20, fontWeight: '800', color: C.navy, marginBottom: 2 },
  statLabel:{ fontSize: 11, color: C.mu, fontWeight: '600' },

  form:     { padding: 20 },
  label:    { fontSize: 10, fontWeight: '700', color: C.tx2, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  input:    { backgroundColor: C.white, borderWidth: 1, borderColor: C.bd, borderRadius: 10, padding: 13, fontSize: 14, color: C.tx },
  textarea: { height: 80 },
  readOnly: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.bd, borderRadius: 10, padding: 13 },
  readOnlyText: { fontSize: 14, color: C.tx2 },
  saveBtn:     { marginTop: 24, backgroundColor: C.navy, borderRadius: 10, padding: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
})
