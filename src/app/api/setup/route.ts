import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/setup
 * Bootstrap the very first admin account.
 * Protected by SETUP_SECRET (falls back to CRON_SECRET).
 * Fails if an admin already exists — one-time use only.
 */
export async function POST(req: NextRequest) {
  const { email, password, full_name, username, setup_key } = await req.json()

  // Verify setup secret
  const secret = process.env.SETUP_SECRET ?? process.env.CRON_SECRET
  if (!secret || setup_key !== secret) {
    return NextResponse.json({ error: 'Invalid setup key' }, { status: 403 })
  }

  if (!email || !password || !full_name || !username) {
    return NextResponse.json({ error: 'email, password, full_name and username are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Prevent re-running if an admin already exists
  const { data: existing } = await admin.from('users').select('id').eq('role', 'admin').limit(1)
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Setup already complete. An admin account already exists.' }, { status: 409 })
  }

  // Create Supabase Auth user — email_confirm:true skips confirmation email
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, username },
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create auth user' }, { status: 400 })
  }

  // Insert directly into users table as admin (bypass trigger's default role)
  const { error: dbError } = await admin.from('users').upsert({
    id: authData.user.id,
    email,
    full_name,
    username,
    role: 'admin',
    rank: 'director',
    is_active: true,
  })

  if (dbError) {
    // Roll back auth user
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, message: 'Admin account created. You can now log in.' })
}
