import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import Avatar from '@/components/ui/Avatar'
import RankBadge from '@/components/ui/RankBadge'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/formatDate'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*,branches(name)')
    .eq('id', user.id)
    .single()

  const [activitiesRes, goalsRes] = await Promise.all([
    supabase.from('activities').select('status').eq('user_id',user.id),
    supabase.from('goals').select('status').eq('user_id',user.id),
  ])

  const acts = activitiesRes.data ?? []
  const goals = goalsRes.data ?? []

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title="My Profile" />
      <div className="rounded-xl border p-6 mb-6" style={{ background:'var(--bg-surface)', borderColor:'var(--border)' }}>
        <div className="flex items-start gap-5">
          <Avatar name={profile?.full_name??'?'} src={profile?.avatar_url} size="lg" />
          <div>
            <h2 className="text-xl font-bold" style={{ color:'var(--text-primary)' }}>{profile?.full_name}</h2>
            <p className="text-sm" style={{ color:'var(--text-muted)' }}>@{profile?.username}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <RankBadge rank={profile?.rank??'distributor'} />
              <Badge variant="info">{profile?.role}</Badge>
              {(profile?.branches as any)?.name && <Badge>{(profile?.branches as any).name}</Badge>}
            </div>
            {profile?.bio && <p className="mt-3 text-sm" style={{ color:'var(--text-secondary)' }}>{profile.bio}</p>}
            <p className="text-xs mt-2" style={{ color:'var(--text-muted)' }}>Member since {profile?.created_at ? formatDate(profile.created_at) : '—'}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Total Activities', value: acts.length },
          { label:'Verified', value: acts.filter(a=>a.status==='verified').length },
          { label:'Goals Completed', value: goals.filter(g=>g.status==='completed').length },
        ].map(s=>(
          <div key={s.label} className="rounded-xl border p-4 text-center" style={{ background:'var(--bg-surface)', borderColor:'var(--border)' }}>
            <p className="text-2xl font-bold" style={{ color:'var(--gold)' }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}