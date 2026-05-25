import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false })

    const body = await req.json().catch(() => ({}))
    const { type, message, page, stack } = body
    if (!message) return NextResponse.json({ ok: false })

    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'client_error',
      target_type: type ?? 'js_error',
      metadata: {
        message: String(message).slice(0, 500),
        page: String(page ?? '').slice(0, 200),
        stack: stack ? String(stack).slice(0, 1000) : null,
        userAgent: req.headers.get('user-agent')?.slice(0, 200),
      },
    })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ ok: false }) }
}
