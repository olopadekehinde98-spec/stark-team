import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { type, message, stack, url, context } = body

  if (!message) return NextResponse.json({ error: 'Missing error message' }, { status: 400 })

  // If OPENAI_API_KEY is not configured, return a graceful fallback instead of crashing
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ analysis: 'AI analysis unavailable (OPENAI_API_KEY not configured).' })
  }

  let analysis = 'Unable to analyze error.'

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const systemPrompt = `You are an expert error analyst embedded in the Stark Team web app (Next.js 14, Supabase, TypeScript).
When given an error, you respond with:
1. A plain-English explanation of what went wrong (1-2 sentences, no jargon)
2. The most likely root cause (1 sentence)
3. A concrete fix or next step (1-2 sentences)

Keep the total response under 120 words. Be direct and actionable. Do not repeat the error message back.`

    const userMsg = `Error type: ${type ?? 'runtime'}
Message: ${message}${stack ? `\nStack: ${stack.split('\n').slice(0, 4).join('\n')}` : ''}${url ? `\nPage: ${url}` : ''}${context ? `\nContext: ${context}` : ''}`

    const response = await openai.chat.completions.create({
      model:      'gpt-4o-mini',
      max_tokens: 200,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMsg },
      ],
    })

    analysis = response.choices[0]?.message?.content ?? 'Unable to analyze error.'
  } catch {
    // OpenAI call failed — return graceful response, never 500
    return NextResponse.json({ analysis: 'AI analysis temporarily unavailable.' })
  }

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
