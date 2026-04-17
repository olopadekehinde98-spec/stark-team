import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
