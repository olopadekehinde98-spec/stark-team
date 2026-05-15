import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { type, message, stack, url, context } = body

  if (!message) return NextResponse.json({ error: 'Missing error message' }, { status: 400 })

  const systemPrompt = `You are an expert error analyst embedded in the Stark Team web app (Next.js 14, Supabase, TypeScript).
When given an error, you respond with:
1. A plain-English explanation of what went wrong (1-2 sentences, no jargon)
2. The most likely root cause (1 sentence)
3. A concrete fix or next step (1-2 sentences)

Keep the total response under 120 words. Be direct and actionable. Do not repeat the error message back.`

  const userMsg = `Error type: ${type ?? 'runtime'}
Message: ${message}${stack ? `\nStack: ${stack.split('\n').slice(0, 4).join('\n')}` : ''}${url ? `\nPage: ${url}` : ''}${context ? `\nContext: ${context}` : ''}`

  const response = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system:     systemPrompt,
    messages:   [{ role: 'user', content: userMsg }],
  })

  const analysis = response.content[0]?.type === 'text' ? response.content[0].text : 'Unable to analyze error.'

  // Persist to error_logs (best-effort — never block the response)
  try {
    const admin = createAdminClient()
    await admin.from('error_logs').insert({
      user_id:  user.id,
      type:     type ?? 'runtime',
      message,
      stack:    stack ?? null,
      url:      url ?? null,
      context:  context ?? null,
      analysis,
    })
  } catch { /* ignore — table may not exist in this env yet */ }

  return NextResponse.json({ analysis })
}
