'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', navy2:'#1E3A5F', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  err:'#DC2626', errBg:'#FEF2F2',
  blue:'#2563EB', blueBg:'#EFF6FF',
}

const RANK_MAP: Record<string, string> = {
  member:'Member', distributor:'Distributor', manager:'Manager',
  senior_manager:'Senior Manager', executive_manager:'Executive', director:'Director',
}

function getInitials(name: string) {
  return (name ?? '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function AOLPage() {
  const [profile,     setProfile]     = useState<any>(null)
  const [activities,  setActivities]  = useState<any[]>([])
  const [teamStats,   setTeamStats]   = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profRes, actsRes, teamRes] = await Promise.all([
        supabase.from('users').select('full_name,rank,role,branch_id').eq('id', user.id).single(),
        supabase.from('activities')
          .select('id,title,activity_type,status,submitted_at,points')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(20),
        supabase.from('users')
          .select('id,full_name,rank,role')
          .neq('id', user.id)
          .limit(10),
      ])

      setProfile(profRes.data)
      setActivities(actsRes.data ?? [])
      setTeamStats(teamRes.data ?? [])
      setLoading(false)
    })()
  }, [])

  const verified  = activities.filter(a => a.status === 'verified').length
  const pending   = activities.filter(a => a.status === 'pending').length
  const rejected  = activities.filter(a => a.status === 'rejected').length
  const totalPts  = activities.filter(a => a.status === 'verified').reduce((s, a) => s + (a.points ?? 0), 0)
  const rate      = activities.length ? Math.round((verified / activities.length) * 100) : 0

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:`3px solid ${S.bd}`, borderTop:`3px solid ${S.navy}`, animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Activity Overview & Leaderboard</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>Your personal activity summary and team standings</p>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'Total Activities', value: activities.length, color: S.navy },
          { label:'Verified',         value: verified,           color: S.ok  },
          { label:'Pending',          value: pending,            color: S.blue},
          { label:'Verified Rate',    value: `${rate}%`,         color: S.gold},
        ].map(s => (
          <div key={s.label} style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.04)', borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, fontFamily:"'JetBrains Mono',monospace" }}>{s.value}</div>
            <div style={{ fontSize:12, color:S.tx2, marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:18 }}>

        {/* Recent activities */}
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding:'16px 20px', borderBottom:`1px solid ${S.bd}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx }}>Recent Activities</div>
            <a href="/activities" style={{ fontSize:12, color:S.blue, textDecoration:'none', fontWeight:600 }}>View all →</a>
          </div>
          {activities.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:S.mu, fontSize:13 }}>No activities yet. <a href="/activities/submit" style={{ color:S.blue }}>Submit one →</a></div>
          ) : activities.map((a, i, arr) => {
            const statusColor = a.status === 'verified' ? S.ok : a.status === 'pending' ? S.blue : S.err
            const statusBg    = a.status === 'verified' ? S.okBg : a.status === 'pending' ? S.blueBg : S.errBg
            return (
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom: i < arr.length-1 ? `1px solid ${S.bd}` : 'none' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:statusColor, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:S.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</div>
                  <div style={{ fontSize:11, color:S.mu, marginTop:2 }}>
                    {a.activity_type} · {new Date(a.submitted_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                  </div>
                </div>
                <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, background:statusBg, color:statusColor }}>
                  {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                </span>
                {a.points > 0 && a.status === 'verified' && (
                  <span style={{ fontSize:11, fontWeight:700, color:S.gold }}>+{a.points}pts</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Team members */}
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding:'16px 20px', borderBottom:`1px solid ${S.bd}` }}>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx }}>Team Members</div>
          </div>
          {teamStats.length === 0 ? (
            <div style={{ padding:30, textAlign:'center', color:S.mu, fontSize:13 }}>No team members yet</div>
          ) : teamStats.map((m, i, arr) => (
            <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 20px', borderBottom: i < arr.length-1 ? `1px solid ${S.bd}` : 'none' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:S.goldBg, border:`1px solid ${S.goldBd}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:S.navy, flexShrink:0 }}>
                {getInitials(m.full_name)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:S.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.full_name}</div>
                <div style={{ fontSize:11, color:S.mu }}>{RANK_MAP[m.rank] ?? m.rank}</div>
              </div>
              <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:S.s3, color:S.tx2, textTransform:'capitalize' }}>
                {m.role}
              </span>
            </div>
          ))}
          <div style={{ padding:'12px 20px', borderTop:`1px solid ${S.bd}` }}>
            <a href="/team" style={{ fontSize:12, color:S.blue, textDecoration:'none', fontWeight:600 }}>View full team →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
