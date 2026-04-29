import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// POST /api/storage/ensure-buckets
// Creates avatars + activity-proofs buckets if they don't exist
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const buckets = [
    { id: 'avatars',         public: true },
    { id: 'activity-proofs', public: true },
  ]

  const results: Record<string, string> = {}
  for (const b of buckets) {
    const { error } = await admin.storage.createBucket(b.id, {
      public: b.public,
      fileSizeLimit: 10 * 1024 * 1024, // 10 MB
    })
    // Ignore "already exists" error
    if (error && !error.message.toLowerCase().includes('already exists')) {
      results[b.id] = 'error: ' + error.message
    } else {
      results[b.id] = 'ok'
    }
  }

  return NextResponse.json({ results })
}
