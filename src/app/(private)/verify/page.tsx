import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import VerifyQueueClient from './VerifyQueueClient'

export default async function VerifyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role,rank,branch_id').eq('id', user.id).single()
  if (!profile || (profile.role !== 'leader' && profile.role !== 'admin')) redirect('/dashboard')

  const admin = createAdminClient()

  // Build the set of member IDs this leader can verify:
  // 1) Members in the same branch (if branch_id is set)
  // 2) Members directly invited by this leader (invited_by = user.id)
  // 3) Admin can verify everyone
  let memberIds: string[] = []

  if (profile.role === 'admin') {
    // Admin sees everyone's pending activities
    const { data: all } = await admin.from('users').select('id').neq('id', user.id)
    memberIds = (all ?? []).map((u: any) => u.id)
  } else {
    // Get branch members
    const branchIds: string[] = []
    if (profile.branch_id) {
      const { data: bm } = await admin.from('users').select('id').eq('branch_id', profile.branch_id).neq('id', user.id)
      bm?.forEach((m: any) => branchIds.push(m.id))
    }
    // Get directly invited members
    const { data: invited } = await admin.from('users').select('id').eq('invited_by', user.id)
    invited?.forEach((m: any) => { if (!branchIds.includes(m.id)) branchIds.push(m.id) })
    memberIds = branchIds
  }

  const [pendingRes, verifiedTodayRes] = await Promise.all([
    memberIds.length
      ? admin
          .from('activities')
          .select('id,title,activity_type,activity_date,proof_url,proof_type,submitted_at,user_id,users!inner(full_name,rank,username)')
          .eq('status', 'pending')
          .in('user_id', memberIds)
          .order('submitted_at', { ascending: true })
          .limit(50)
      : Promise.resolve({ data: [] }),
    memberIds.length
      ? admin
          .from('activities')
          .select('id')
          .eq('status', 'verified')
          .in('user_id', memberIds)
          .gte('submitted_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      : Promise.resolve({ data: [] }),
  ])

  const pendingActivities = pendingRes.data ?? []
  const verifiedToday     = verifiedTodayRes.data?.length ?? 0
  const count             = pendingActivities.length
  const avgWaitHours      = count > 0
    ? Math.round(pendingActivities.reduce((sum, a) =>
        sum + (Date.now() - new Date(a.submitted_at).getTime()) / 3600000, 0) / count)
    : 0

  return (
    <VerifyQueueClient
      activities={pendingActivities as any}
      currentUserId={user.id}
      verifiedToday={verifiedToday}
      avgWaitHours={avgWaitHours}
    />
  )
}
