import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { C } from '@/lib/colors'

const TYPES = ['Sales', 'Recruitment', 'Training', 'Meeting', 'Marketing', 'Other']

export default function SubmitActivity() {
  const router = useRouter()
  const [title,   setTitle]   = useState('')
  const [type,    setType]    = useState('')
  const [desc,    setDesc]    = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!title.trim()) { Alert.alert('Error', 'Please enter an activity title.'); return }
    if (!type)         { Alert.alert('Error', 'Please select an activity type.'); return }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { error } = await supabase.from('activities').insert({
      user_id:       user.id,
      title:         title.trim(),
      activity_type: type,
      description:   desc.trim() || null,
      status:        'pending',
      submitted_at:  new Date().toISOString(),
    })

    setLoading(false)
    if (error) { Alert.alert('Error', error.message); return }
    Alert.alert('Submitted!', 'Your activity is pending verification.', [{ text: 'OK', onPress: () => router.back() }])
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.pageTitle}>Submit Activity</Text>

      <Text style={s.label}>TITLE *</Text>
      <TextInput style={s.input} placeholder="What did you do?" placeholderTextColor={C.mu} value={title} onChangeText={setTitle} />

      <Text style={[s.label, { marginTop: 16 }]}>TYPE *</Text>
      <View style={s.typeGrid}>
        {TYPES.map(t => (
          <TouchableOpacity key={t} style={[s.typeBtn, type === t && s.typeBtnActive]} onPress={() => setType(t)}>
            <Text style={[s.typeBtnText, type === t && s.typeBtnTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[s.label, { marginTop: 16 }]}>DESCRIPTION</Text>
      <TextInput
        style={[s.input, s.textarea]}
        placeholder="Add details..."
        placeholderTextColor={C.mu}
        value={desc}
        onChangeText={setDesc}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity style={s.submitBtn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Submit Activity</Text>}
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

  label:   { fontSize: 10, fontWeight: '700', color: C.tx2, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  input:   { backgroundColor: C.white, borderWidth: 1, borderColor: C.bd, borderRadius: 10, padding: 13, fontSize: 14, color: C.tx },
  textarea:{ height: 100 },

  typeGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn:           { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: C.white, borderWidth: 1, borderColor: C.bd },
  typeBtnActive:     { backgroundColor: C.navy, borderColor: C.navy },
  typeBtnText:       { fontSize: 13, fontWeight: '600', color: C.tx2 },
  typeBtnTextActive: { color: '#fff' },

  submitBtn:  { marginTop: 28, backgroundColor: C.navy, borderRadius: 10, padding: 15, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn:  { marginTop: 12, padding: 15, alignItems: 'center' },
  cancelText: { color: C.tx2, fontSize: 14, fontWeight: '600' },
})
