import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// PATCH /api/profile/avatar  { avatar_url: string }
// Updates the user's avatar_url. Uses admin client so any DB trigger that
// auto-inserts a recognition gets a chance to run; we pre-insert the
// "first photo" recognition with a valid message to satisfy the check constraint.
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { avatar_url } = await req.json()
  if (!avatar_url) return NextResponse.json({ error: 'Missing avatar_url' }, { status: 400 })

  const admin = createAdminClient()

  // Pre-create the "profile photo" recognition badge so a DB trigger cannot
  // create one with an empty message and violate the check constraint.
  try {
    await admin.from('recognitions').insert({
      recipient_id: user.id,
      issued_by:    user.id,
      badge_type:   'activity',
      title:        'Profile Photo Uploaded',
      message:      'Congratulations on completing your profile! Adding a profile photo helps the team recognise and connect with you.',
      is_auto:      true,
    })
  } catch {
    // Ignore — badge may already exist or table may have different schema
  }

  const { error } = await admin.from('users').update({ avatar_url }).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
