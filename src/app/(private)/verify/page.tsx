import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VerifyQueueClient from './VerifyQueueClient'

export default async function VerifyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role,rank,branch_id').eq('id', user.id).single()
  if (!profile || (profile.role !== 'leader' && profile.role !== 'admin')) redirect('/dashboard')

  const { data: branchMembers } = profile.branch_id
    ? await supabase.from('users').select('id').eq('branch_id', profile.branch_id)
    : { data: [] }
  const memberIds = branchMembers?.map((m: any) => m.id) ?? []

  const [pendingRes, verifiedTodayRes] = await Promise.all([
    memberIds.length
      ? supabase
          .from('activities')
          .select('id,title,activity_type,activity_date,proof_url,proof_type,submitted_at,user_id,users!inner(full_name,rank,username)')
          .eq('status', 'pending')
          .in('user_id', memberIds)
          .order('submitted_at', { ascending: true })
          .limit(50)
      : Promise.resolve({ data: [] }),
    memberIds.length
      ? supabase
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
