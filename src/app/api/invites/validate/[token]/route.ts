import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params: _params }: { params: Promise<{ token: string }> }
) {
  const params = await _params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('invite_links')
    .select('id, assigned_role, assigned_rank, assigned_branch, assigned_email, expires_at, is_active, used_by')
    .eq('token', params.token)
    .single()

  if (error || !data) {
    return NextResponse.json({ valid: false, reason: 'Invite link not found.' }, { status: 404 })
  }
  if (!data.is_active) {
    return NextResponse.json({ valid: false, reason: 'This invite link has been deactivated.' }, { status: 410 })
  }
  if (data.used_by) {
    return NextResponse.json({ valid: false, reason: 'This invite link has already been used.' }, { status: 410 })
  }
  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: 'This invite link has expired.' }, { status: 410 })
  }

  return NextResponse.json({
    valid:           true,
    assigned_role:   data.assigned_role,
    assigned_rank:   data.assigned_rank,
    assigned_branch: data.assigned_branch,
    assigned_email:  data.assigned_email,
  })
}
