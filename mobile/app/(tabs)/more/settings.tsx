import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native'
import { useAuth } from '@/lib/auth'
import { C } from '@/lib/colors'

export default function SettingsScreen() {
  const { profile, signOut } = useAuth()

  return (
    <ScrollView style={s.screen}>
      <View style={s.section}>
        <Text style={s.sectionLabel}>ACCOUNT</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Email</Text>
          <Text style={s.rowValue} numberOfLines={1}>{profile?.id ? '(see profile)' : '—'}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>Role</Text>
          <Text style={s.rowValue}>{(profile?.role ?? 'member').replace(/\b\w/g, c => c.toUpperCase())}</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionLabel}>APP</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Version</Text>
          <Text style={s.rowValue}>1.0.0</Text>
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>Platform</Text>
          <Text style={s.rowValue}>Stark Team Mobile</Text>
        </View>
      </View>

      <View style={s.notice}>
        <Text style={s.noticeText}>🔒  This is an invite-only platform. Contact your commanding officer to change account settings.</Text>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: C.bg },

  section:      { margin: 16, marginBottom: 0, backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.bd, overflow: 'hidden' },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.mu, letterSpacing: 2, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.bd },
  rowLabel:     { fontSize: 14, color: C.tx, fontWeight: '500' },
  rowValue:     { fontSize: 14, color: C.tx2, maxWidth: '55%', textAlign: 'right' },

  notice:     { margin: 16, marginTop: 20, backgroundColor: '#F0F7FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 12, padding: 16 },
  noticeText: { fontSize: 13, color: C.tx2, lineHeight: 20 },
})
