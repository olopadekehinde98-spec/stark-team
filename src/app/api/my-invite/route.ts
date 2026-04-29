import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// Any logged-in user can get/create their personal downline invite link
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Find existing active invite link created by this user
  const { data: existing } = await admin
    .from('invite_links')
    .select('id,token,expires_at,is_active,used_by,created_at')
    .eq('created_by', user.id)
    .eq('assigned_role', 'member')
    .is('used_by', null)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const envUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const origin = (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1'))
    ? envUrl
    : new URL(request.url).origin

  if (existing && new Date(existing.expires_at) > new Date()) {
    return NextResponse.json({
      token:      existing.token,
      invite_url: origin + '/signup?token=' + existing.token,
      expires_at: existing.expires_at,
    })
  }

  // Create a new one (90-day expiry, auto-renews)
  const expires_at = new Date(Date.now() + 90 * 86400000).toISOString()
  const { data: created, error } = await admin
    .from('invite_links')
    .insert({
      created_by:    user.id,
      assigned_role: 'member',
      assigned_rank: 'e_member',
      is_active:     true,
      expires_at,
    })
    .select('token,expires_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({
    token:      created.token,
    invite_url: origin + '/signup?token=' + created.token,
    expires_at: created.expires_at,
  })
}

// Regenerate link (creates a new one, old stays but is deactivated)
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Deactivate old links from this user
  await admin
    .from('invite_links')
    .update({ is_active: false })
    .eq('created_by', user.id)
    .eq('assigned_role', 'member')
    .is('used_by', null)

  const expires_at = new Date(Date.now() + 90 * 86400000).toISOString()
  const { data: created, error } = await admin
    .from('invite_links')
    .insert({
      created_by:    user.id,
      assigned_role: 'member',
      assigned_rank: 'e_member',
      is_active:     true,
      expires_at,
    })
    .select('token,expires_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const envUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const origin = (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1'))
    ? envUrl
    : new URL(request.url).origin

  return NextResponse.json({
    token:      created.token,
    invite_url: origin + '/signup?token=' + created.token,
    expires_at: created.expires_at,
  })
}
