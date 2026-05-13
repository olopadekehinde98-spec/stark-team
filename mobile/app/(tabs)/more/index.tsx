import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/lib/auth'
import { C } from '@/lib/colors'

function fmtRank(rank?: string) {
  if (!rank) return 'Member'
  const map: Record<string, string> = {
    e_member: 'E-Member', distributor: 'Distributor', manager: 'Manager',
    senior_manager: 'Senior Manager', executive_manager: 'Executive', director: 'Director',
  }
  return map[rank] ?? rank.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const MENU_ITEMS = [
  { icon: '👤', label: 'Profile',       href: '/(tabs)/more/profile'       },
  { icon: '🔔', label: 'Notifications', href: '/(tabs)/more/notifications'  },
  { icon: '👥', label: 'Team',          href: '/(tabs)/more/team'           },
  { icon: '🏅', label: 'Recognition',   href: '/(tabs)/more/recognition'    },
  { icon: '⚙️', label: 'Settings',      href: '/(tabs)/more/settings'       },
]

export default function MoreScreen() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ])
  }

  return (
    <ScrollView style={s.screen}>
      {/* Profile card */}
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={s.profileInfo}>
          <Text style={s.profileName}>{profile?.full_name ?? '…'}</Text>
          <Text style={s.profileRank}>{fmtRank(profile?.rank)}</Text>
          <View style={[s.rolePill, { backgroundColor: profile?.role === 'admin' ? C.gold + '22' : C.navy + '18' }]}>
            <Text style={[s.roleText, { color: profile?.role === 'admin' ? C.gold : C.navy }]}>
              {(profile?.role ?? 'member').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Menu items */}
      <View style={s.section}>
        {MENU_ITEMS.map(item => (
          <TouchableOpacity key={item.href} style={s.menuItem} onPress={() => router.push(item.href as any)}>
            <Text style={s.menuIcon}>{item.icon}</Text>
            <Text style={s.menuLabel}>{item.label}</Text>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}

        {(profile?.role === 'leader' || profile?.role === 'admin') && (
          <TouchableOpacity style={s.menuItem} onPress={() => router.push('/(tabs)/more/verify' as any)}>
            <Text style={s.menuIcon}>✅</Text>
            <Text style={s.menuLabel}>Verify Activities</Text>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sign out */}
      <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
        <Text style={s.signOutText}>⏻  Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  profileCard: { backgroundColor: C.navy, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar:      { width: 60, height: 60, borderRadius: 30, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 22, fontWeight: '800', color: C.navy },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 2 },
  profileRank: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 8 },
  rolePill:    { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  roleText:    { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  section:   { backgroundColor: C.white, marginHorizontal: 16, marginTop: 20, borderRadius: 12, borderWidth: 1, borderColor: C.bd, overflow: 'hidden' },
  menuItem:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.bd },
  menuIcon:  { fontSize: 20, marginRight: 14, width: 28, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: C.tx },
  menuArrow: { fontSize: 20, color: C.mu, fontWeight: '300' },

  signOutBtn:  { margin: 16, marginTop: 20, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 12, padding: 16, alignItems: 'center' },
  signOutText: { fontSize: 15, fontWeight: '700', color: C.err },
})
