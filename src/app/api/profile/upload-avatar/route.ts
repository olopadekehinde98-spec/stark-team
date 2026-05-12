import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/profile/upload-avatar
// Accepts multipart/form-data with a "file" field.
// Uses the service-role admin client to upload to Supabase Storage, bypassing RLS.
export async function POST(req: NextRequest) {
  // Authenticate the caller
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Parse the uploaded file
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WebP, or GIF images are allowed' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 5 MB' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Ensure the avatars bucket exists (no-op if already there)
  await admin.storage.createBucket('avatars', {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
  }).catch(() => {})

  // Convert File to Buffer for server-side upload
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${user.id}/avatar.${ext}`

  // Upload using the admin client — this bypasses Storage RLS
  const { error: upErr } = await admin.storage
    .from('avatars')
    .upload(path, buffer, { upsert: true, contentType: file.type })

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

  // Build the public URL with a cache-buster so the browser reloads immediately
  const { data: urlData } = admin.storage.from('avatars').getPublicUrl(path)
  const avatar_url = urlData.publicUrl + '?t=' + Date.now()

  // Persist avatar_url to the users table
  const { error: dbErr } = await admin
    .from('users')
    .update({ avatar_url })
    .eq('id', user.id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })

  // Pre-create the profile-photo recognition badge (ignore if already exists)
  try {
    await admin.from('recognitions').insert({
      recipient_id: user.id,
      issued_by:    user.id,
      badge_type:   'activity',
      title:        'Profile Photo Uploaded',
      message:      'Great job completing your profile! A profile photo helps your team recognise you.',
      is_auto:      true,
    })
  } catch { /* already exists or table schema differs — ignore */ }

  return NextResponse.json({ avatar_url })
}
