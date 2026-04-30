import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import VerifyQueueClient from './VerifyQueueClient'
import GoalApprovalClient from './GoalApprovalClient'

const S = {
  bd:'#E2E8F0', navy:'#0F1C2E',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
}

export default async function VerifyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role,rank,branch_id').eq('id', user.id).single()
  if (!profile || (profile.role !== 'leader' && profile.role !== 'admin')) redirect('/dashboard')

  const admin = createAdminClient()

  let memberIds: string[] = []

  if (profile.role === 'admin') {
    const { data: all } = await admin.from('users').select('id')
    memberIds = (all ?? []).map((u: any) => u.id)
  } else {
    const branchIds: string[] = []
    if (profile.branch_id) {
      const { data: bm } = await admin.from('users').select('id').eq('branch_id', profile.branch_id).neq('id', user.id)
      bm?.forEach((m: any) => branchIds.push(m.id))
    }
    const { data: invited } = await admin.from('users').select('id').eq('invited_by', user.id)
    invited?.forEach((m: any) => { if (!branchIds.includes(m.id)) branchIds.push(m.id) })
    memberIds = branchIds
  }

  // Fetch pending activities AND pending goals in parallel
  const [pendingActRes, verifiedTodayRes, pendingGoalsRes] = await Promise.all([
    memberIds.length
      ? admin
          .from('activities')
          .select('id,title,activity_type,activity_date,proof_url,proof_type,submitted_at,user_id')
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
          .gte('submitted_at', new Date(new Date().setHours(0,0,0,0)).toISOString())
      : Promise.resolve({ data: [] }),
    memberIds.length
      ? admin
          .from('goals')
          .select('id,title,goal_type,target_value,deadline,description,created_at,user_id')
          .eq('status', 'pending_approval')
          .in('user_id', memberIds)
          .order('created_at', { ascending: true })
          .limit(50)
      : Promise.resolve({ data: [] }),
  ])

  // Hydrate activities with user info
  const rawActivities = pendingActRes.data ?? []
  const actUserIds = [...new Set(rawActivities.map((a: any) => a.user_id))]
  let actUserMap: Record<string, any> = {}
  if (actUserIds.length > 0) {
    const { data: users } = await admin.from('users').select('id,full_name,rank,username').in('id', actUserIds)
    actUserMap = Object.fromEntries((users ?? []).map((u: any) => [u.id, u]))
  }
  const pendingActivities = rawActivities.map((a: any) => ({
    ...a,
    users: actUserMap[a.user_id] ?? { full_name:'Unknown', rank:'', username:'' },
  }))

  // Hydrate goals with owner info
  const rawGoals = pendingGoalsRes.data ?? []
  const goalUserIds = [...new Set(rawGoals.map((g: any) => g.user_id))]
  let goalUserMap: Record<string, any> = {}
  if (goalUserIds.length > 0) {
    const { data: gUsers } = await admin.from('users').select('id,full_name,rank,username').in('id', goalUserIds)
    goalUserMap = Object.fromEntries((gUsers ?? []).map((u: any) => [u.id, u]))
  }
  const pendingGoals = rawGoals.map((g: any) => ({
    ...g,
    owner: goalUserMap[g.user_id] ?? { full_name:'Unknown', rank:'', username:'' },
  }))

  const verifiedToday = verifiedTodayRes.data?.length ?? 0
  const count = pendingActivities.length
  const avgWaitHours = count > 0
    ? Math.round(pendingActivities.reduce((sum: number, a: any) =>
        sum + (Date.now() - new Date(a.submitted_at).getTime()) / 3600000, 0) / count)
    : 0

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Review Queue</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>
          {pendingActivities.length} pending {pendingActivities.length===1?'activity':'activities'} · {pendingGoals.length} pending {pendingGoals.length===1?'goal':'goals'}
        </p>
      </div>

      {/* ── Activities section ── */}
      <div style={{ marginBottom:32 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:S.mu, letterSpacing:'0.06em', textTransform:'uppercase' }}>
            📋 Activities ({pendingActivities.length})
          </div>
          <div style={{ flex:1, height:1, background:S.bd }} />
        </div>
        <VerifyQueueClient
          activities={pendingActivities as any}
          currentUserId={user.id}
          verifiedToday={verifiedToday}
          avgWaitHours={avgWaitHours}
        />
      </div>

      {/* ── Goals section ── */}
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:S.mu, letterSpacing:'0.06em', textTransform:'uppercase' }}>
            🎯 Goal Approvals ({pendingGoals.length})
          </div>
          <div style={{ flex:1, height:1, background:S.bd }} />
        </div>
        <GoalApprovalClient goals={pendingGoals as any} />
      </div>
    </div>
  )
}
