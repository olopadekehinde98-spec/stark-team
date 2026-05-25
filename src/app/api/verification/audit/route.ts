/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  // Fetch verification records
  const { data: records, error } = await admin
    .from('verification_records')
    .select('id,activity_id,verified_by,action,notes,rejection_reason,created_at')
    .order('created_at', { ascending: false })
    .limit(300)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!records || records.length === 0) return NextResponse.json([])

  // Collect unique IDs for batch lookups
  const activityIds = [...new Set(records.map((r: any) => r.activity_id).filter(Boolean))]
  const verifierIds = [...new Set(records.map((r: any) => r.verified_by).filter(Boolean))]

  const [activitiesRes, usersRes] = await Promise.all([
    activityIds.length > 0
      ? admin.from('activities').select('id,title,activity_type').in('id', activityIds)
      : Promise.resolve({ data: [] }),
    verifierIds.length > 0
      ? admin.from('users').select('id,full_name,rank').in('id', verifierIds)
      : Promise.resolve({ data: [] }),
  ])

  const activityMap = Object.fromEntries(
    (activitiesRes.data ?? []).map((a: any) => [a.id, a])
  )
  const userMap = Object.fromEntries(
    (usersRes.data ?? []).map((u: any) => [u.id, u])
  )

  const enriched = records.map((r: any) => ({
    ...r,
    activity: activityMap[r.activity_id] ?? null,
    verifier: userMap[r.verified_by] ?? null,
  }))

  return NextResponse.json(enriched)
}
