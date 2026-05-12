import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { C } from '@/lib/colors'

export default function LoginScreen() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSignIn() {
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return }
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) setError(error.message)
    // On success: onAuthStateChange in AuthProvider triggers NavGuard to navigate automatically
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo area */}
        <View style={s.logoBox}>
          <View style={s.logoMark}>
            <Text style={s.logoText}>ST</Text>
          </View>
          <Text style={s.logoName}>STARK TEAM</Text>
          <View style={s.badge}>
            <View style={s.dot} />
            <Text style={s.badgeText}>PRIVATE OPERATIONS PLATFORM</Text>
          </View>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.heading}>Sign In</Text>

          {!!error && (
            <View style={s.errBox}>
              <Text style={s.errText}>⚠  {error}</Text>
            </View>
          )}

          <Text style={s.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={s.input}
            placeholder="operative@stark.team"
            placeholderTextColor={C.mu}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={[s.label, { marginTop: 16 }]}>PASSWORD</Text>
          <View style={s.pwRow}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="••••••••••••"
              placeholderTextColor={C.mu}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              autoComplete="password"
            />
            <TouchableOpacity onPress={() => setShowPw(v => !v)} style={s.eyeBtn}>
              <Text style={s.eyeIcon}>{showPw ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.signInBtn} onPress={handleSignIn} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.signInText}>Sign In  →</Text>
            }
          </TouchableOpacity>

          <View style={s.notice}>
            <Text style={s.noticeText}>🔒  Invite-only platform — request access from your commanding officer</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  scroll:    { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },

  logoBox:   { alignItems: 'center', marginBottom: 32 },
  logoMark:  { width: 72, height: 72, borderRadius: 16, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText:  { fontSize: 28, fontWeight: '800', color: C.navy },
  logoName:  { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 4, marginBottom: 10 },
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(99,102,241,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)' },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  badgeText: { fontSize: 9, color: '#6366f1', fontWeight: '700', letterSpacing: 1.5 },

  card:     { width: '100%', maxWidth: 420, backgroundColor: '#0d1117', borderRadius: 20, padding: 28, borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)' },
  heading:  { fontSize: 14, fontWeight: '700', color: C.mu, letterSpacing: 3, textAlign: 'center', marginBottom: 20 },

  errBox:  { backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', borderRadius: 10, padding: 12, marginBottom: 16 },
  errText: { color: '#f87171', fontSize: 13, fontWeight: '500' },

  label: { fontSize: 10, fontWeight: '700', color: '#4b5563', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 10, padding: 13, fontSize: 14, color: '#f1f5f9' },

  pwRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 10, padding: 13 },
  eyeIcon:{ fontSize: 16 },

  signInBtn:  { marginTop: 24, backgroundColor: C.gold, borderRadius: 10, padding: 15, alignItems: 'center' },
  signInText: { color: C.navy, fontSize: 15, fontWeight: '800', letterSpacing: 1 },

  notice:     { marginTop: 20, backgroundColor: 'rgba(99,102,241,0.05)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.12)', borderRadius: 10, padding: 12 },
  noticeText: { fontSize: 11, color: '#4b5563', lineHeight: 18 },
})
