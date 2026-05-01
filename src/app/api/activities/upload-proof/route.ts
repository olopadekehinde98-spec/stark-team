import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/activities/upload-proof
// Accepts multipart/form-data with a "file" field.
// Uses the service-role admin client to upload to Supabase Storage,
// bypassing Row Level Security so uploads always work.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
  if (!ALLOWED.includes(file.type) && !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 10 MB' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Ensure bucket exists (no-op if already created)
  await admin.storage.createBucket('activity-proofs', {
    public: true,
    fileSizeLimit: 15 * 1024 * 1024,
  }).catch(() => {})

  const bytes  = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext    = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path   = `${user.id}/${Date.now()}.${ext}`

  const { error: upErr } = await admin.storage
    .from('activity-proofs')
    .upload(path, buffer, { upsert: false, contentType: file.type })

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

  const { data: urlData } = admin.storage.from('activity-proofs').getPublicUrl(path)
  return NextResponse.json({ url: urlData.publicUrl })
}
