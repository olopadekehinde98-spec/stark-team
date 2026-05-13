import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { C } from '@/lib/colors'

const TYPES = ['Daily', 'Weekly', 'Monthly']

export default function CreateGoal() {
  const router = useRouter()
  const [title,   setTitle]   = useState('')
  const [type,    setType]    = useState('')
  const [target,  setTarget]  = useState('')
  const [deadline,setDeadline]= useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!title.trim())     { Alert.alert('Error', 'Please enter a goal title.'); return }
    if (!type)             { Alert.alert('Error', 'Please select a goal type.'); return }
    if (!target || isNaN(Number(target)) || Number(target) <= 0) {
      Alert.alert('Error', 'Please enter a valid target number.'); return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { error } = await supabase.from('goals').insert({
      user_id:        user.id,
      title:          title.trim(),
      goal_type:      type,
      target_metric:  Number(target),
      current_metric: 0,
      status:         'active',
      deadline:       deadline || null,
    })

    setLoading(false)
    if (error) { Alert.alert('Error', error.message); return }
    Alert.alert('Goal Created!', 'Your goal has been created.', [{ text: 'OK', onPress: () => router.back() }])
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.pageTitle}>Create Goal</Text>

      <Text style={s.label}>GOAL TITLE *</Text>
      <TextInput style={s.input} placeholder="e.g. Get 10 new referrals" placeholderTextColor={C.mu} value={title} onChangeText={setTitle} />

      <Text style={[s.label, { marginTop: 16 }]}>GOAL TYPE *</Text>
      <View style={s.typeRow}>
        {TYPES.map(t => (
          <TouchableOpacity key={t} style={[s.typeBtn, type === t && s.typeBtnActive]} onPress={() => setType(t)}>
            <Text style={[s.typeBtnText, type === t && s.typeBtnTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[s.label, { marginTop: 16 }]}>TARGET *</Text>
      <TextInput style={s.input} placeholder="e.g. 10" placeholderTextColor={C.mu} value={target} onChangeText={setTarget} keyboardType="numeric" />

      <Text style={[s.label, { marginTop: 16 }]}>DEADLINE (YYYY-MM-DD)</Text>
      <TextInput style={s.input} placeholder="2025-12-31" placeholderTextColor={C.mu} value={deadline} onChangeText={setDeadline} />

      <TouchableOpacity style={s.submitBtn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Create Goal</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
        <Text style={s.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: C.bg },
  content:   { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: C.tx, marginBottom: 24 },
  label:     { fontSize: 10, fontWeight: '700', color: C.tx2, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  input:     { backgroundColor: C.white, borderWidth: 1, borderColor: C.bd, borderRadius: 10, padding: 13, fontSize: 14, color: C.tx },
  typeRow:   { flexDirection: 'row', gap: 10 },
  typeBtn:           { flex: 1, padding: 12, borderRadius: 10, backgroundColor: C.white, borderWidth: 1, borderColor: C.bd, alignItems: 'center' },
  typeBtnActive:     { backgroundColor: C.navy, borderColor: C.navy },
  typeBtnText:       { fontSize: 13, fontWeight: '600', color: C.tx2 },
  typeBtnTextActive: { color: '#fff' },
  submitBtn:  { marginTop: 28, backgroundColor: C.navy, borderRadius: 10, padding: 15, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn:  { marginTop: 12, padding: 15, alignItems: 'center' },
  cancelText: { color: C.tx2, fontSize: 14, fontWeight: '600' },
})
