import { createClient } from '@/lib/supabase/server'

export async function getSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  return profile ? { ...profile, authId: user.id } : null
}