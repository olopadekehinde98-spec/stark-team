import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/push/register-expo-token
 * Body: { token: string, device?: string }
 * Called by the Expo mobile app on launch to register its push token.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { token, device } = body
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }
  if (!token.startsWith('ExponentPushToken[')) {
    return NextResponse.json({ error: 'Invalid Expo push token format' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Upsert — one row per token (token is unique)
  const { error } = await admin
    .from('expo_push_tokens')
    .upsert({
      user_id:    user.id,
      token,
      device:     device ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'token' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
