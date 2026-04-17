import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCoachContext } from '@/lib/ai-coach/contextBuilder'
import { buildSystemPrompt } from '@/lib/ai-coach/systemPrompt'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function checkRateLimit(userId: string): Promise<boolean> {
  const adminSupabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const { count } = await adminSupabase
    .from('ai_coach_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today)
  return (count ?? 0) < 20
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const withinLimit = await checkRateLimit(user.id)
  if (!withinLimit) {
    return NextResponse.json(
      { error: 'Daily AI Coach limit reached (20 messages). Resets at midnight.' },
      { status: 429 }
    )
  }

  const body = await request.json()
  const { message, history } = body

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const mode = profile?.role === 'admin' ? 'admin' : profile?.role === 'leader' ? 'leader' : 'member'
  const context = await buildCoachContext(user.id, mode)
  const systemPrompt = buildSystemPrompt(context)

  const messages = [
    ...(history ?? []),
    { role: 'user' as const, content: message },
  ]

  const response = await anthropic.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 500,
    system:     systemPrompt,
    messages,
  })

  const reply = response.content[0]?.type === 'text' ? response.content[0].text : ''

  const adminSupabase = createAdminClient()
  await adminSupabase.from('ai_coach_logs').insert({
    user_id:          user.id,
    mode,
    user_message:     message,
    ai_response:      reply,
    context_snapshot: context,
  })

  return NextResponse.json({ reply })
}
