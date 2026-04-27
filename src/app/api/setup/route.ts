import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/setup — check whether setup is still needed
 * POST /api/setup — create the first admin account
 * Protected by CRON_SECRET as a setup key.
 * Automatically disabled once any user exists.
 */
export async function GET() {
  const admin = createAdminClient()
  const { count } = await admin.from('users').select('*', { count: 'exact', head: true })
  return NextResponse.json({ setupRequired: count === 0 })
}

export async function POST(req: NextRequest) {
  const admin = createAdminClient()

  // Block if any users already exist
  const { count } = await admin.from('users').select('*', { count: 'exact', head: true })
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Setup already completed. Use an invite link to join.' },
      { status: 403 }
    )
  }

  const body = await req.json()
  const { email, password, full_name, username, setup_key } = body

  // Validate setup key against CRON_SECRET
  const validKey = process.env.CRON_SECRET
  if (!validKey || setup_key !== validKey) {
    return NextResponse.json({ error: 'Invalid setup key.' }, { status: 403 })
  }

  if (!email || !password || !full_name || !username) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  // Create Supabase auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, username, role: 'admin', rank: 'director' },
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const userId = authData.user.id

  // Upsert profile (trigger may have already run from the auth insert)
  const { error: profileError } = await admin.from('users').upsert({
    id: userId,
    email,
    full_name,
    username: username.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    role: 'admin',
    rank: 'director',
    is_active: true,
  }, { onConflict: 'id' })

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
