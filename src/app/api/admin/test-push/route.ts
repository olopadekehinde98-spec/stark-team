import { createClient } from '@/lib/supabase/server'
import { sendPushToUser, sendPushToAll } from '@/lib/push'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, body, target } = await request.json()
  if (!title || !body) return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })

  const payload = { title, body, url: '/notifications' }

  if (target === 'all') {
    await sendPushToAll(payload)
    return NextResponse.json({ ok: true, sent: 'all' })
  } else {
    // Send only to the admin themselves (test)
    await sendPushToUser(user.id, payload)
    return NextResponse.json({ ok: true, sent: 'self' })
  }
}
