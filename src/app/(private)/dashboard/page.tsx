'use client'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const S = {
  s1:'#FFFFFF',s2:'#F8FAFC',s3:'#EEF2F7',bd:'#E2E8F0',
  navy:'#0F1C2E',navy2:'#1E3A5F',gold:'#D4A017',
  goldBg:'#FEF9EC',goldBd:'#F5D87A',
  tx:'#0F172A',tx2:'#475569',mu:'#94A3B8',
  ok:'#16A34A',okBg:'#F0FDF4',okBd:'#86EFAC',
  warn:'#D97706',warnBg:'#FFFBEB',warnBd:'#FCD34D',
  err:'#DC2626',errBg:'#FEF2F2',errBd:'#FCA5A5',
  blue:'#2563EB',blueBg:'#EFF6FF',blueBd:'#BFDBFE',
}

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, actsRes, goalsRes, recentRes, lbRes] = await Promise.all([
        supabase.from('users').select('full_name,rank,role,branch_id').eq('id', user.id).single(),
        supabase.from('activities').select('status').eq('user_id', user.id),
        supabase.from('goals').select('title,status,target_value,current_value,goal_type,deadline').eq('user_id', user.id).eq('status','active').limit(2),
        supabase.from('activities').select('id,title,activity_type,status,submitted_at').eq('user_id', user.id)
          .order('submitted_at', { ascending: false }).limit(5),
        supabase.from('leaderboard_snapshots').select('rank_position').eq('user_id', user.id)
          .eq('period','monthly').order('snapshot_date', { ascending: false }).limit(1).maybeSingle(),
      ])

      const acts     = actsRes.data ?? []
      const verified = acts.filter((a: any) => a.status === 'verified').length
      const pending  = acts.filter((a: any) => a.status === 'pending').length
      const rate     = acts.length > 0 ? Math.round((verified / acts.length) * 100) : 0

      setData({
        profile: profileRes.data,
        total: acts.length, verified, pending, rate,
        goals:   goalsRes.data  ?? [],
        recent:  recentRes.data ?? [],
        lb:      lbRes.data?.rank_position ?? null,
      })
      setLoading(false)
    })()
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:`3px solid ${S.bd}`, borderTop:`3px solid ${S.navy}`, animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!data) return null

  const name      = data.profile?.full_name?.split(' ')[0] ?? 'there'
  const rankLabel = (data.profile?.rank ?? 'member').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  const today     = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
  const roleLabel = (data.profile?.role ?? 'member').replace(/\b\w/g, (c: string) => c.toUpperCase())

  const statusStyle = (s: string) => ({
    fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, display:'inline-block',
    background: s==='verified' ? S.okBg : s==='pending' ? S.blueBg : S.errBg,
    color:      s==='verified' ? S.ok   : s==='pending' ? S.blue   : S.err,
    border:    `1px solid ${s==='verified' ? S.okBd : s==='pending' ? S.blueBd : S.errBd}`,
  })

  const typeColor = (t: string) => {
    const m: Record<string,string> = { Monthly:'#D4A017', Weekly:'#D97706', Daily:'#2563EB' }
    return m[t] ?? '#94A3B8'
  }

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Page header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>
          {greeting()}, {name} 👋
        </h1>
        <p style={{ fontSize:13, color:S.tx2 }}>{roleLabel} · {today}</p>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { icon:'📊', label:'Activities this month', value: data.total,    sub:`${data.verified} verified`,   badge:'+'+data.total, bc:S.ok   },
          { icon:'⚡', label:'Verified rate',          value:`${data.rate}%`, sub:'Target: 60%+',              badge:data.rate>=60?'Good':'Low',bc:data.rate>=60?S.ok:S.warn },
          { icon:'🏆', label:'Leaderboard rank',       value: data.lb ? `#${data.lb}` : '—', sub:'Monthly ranking', badge:'Live', bc:S.blue },
          { icon:'⏳', label:'Pending verification',   value: data.pending,  sub:'Awaiting review',           badge:data.pending>0?'Action':'Clear', bc:data.pending>0?S.err:S.ok },
        ].map((s,i) => (
          <div key={i} style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:S.s3, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{s.icon}</div>
              <span style={{ fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20, background:s.bc+'18', color:s.bc }}>{s.badge}</span>
            </div>
            <div style={{ fontSize:28, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', lineHeight:1, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:12, fontWeight:500, color:S.tx2, marginBottom:2 }}>{s.label}</div>
            <div style={{ fontSize:11, color:S.mu }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 290px', gap:18 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Recent Activities */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <span style={{ fontSize:14, fontWeight:700, color:S.tx }}>Recent Activities</span>
              <Link href="/activities" style={{ fontSize:12, color:S.blue, fontWeight:600, textDecoration:'none' }}>View all →</Link>
            </div>
            {data.recent.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px 0', color:S.mu, fontSize:13 }}>No activities yet</div>
            ) : data.recent.map((a: any, i: number, arr: any[]) => (
              <div key={a.id ?? i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:i<arr.length-1?`1px solid ${S.bd}`:'none' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:a.status==='verified'?S.ok:a.status==='pending'?S.blue:S.err, flexShrink:0 }} />
                <span style={{ flex:1, fontSize:13, fontWeight:500, color:S.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:S.mu, marginRight:10, flexShrink:0 }}>
                  {timeAgo(a.submitted_at)}
                </span>
                <span style={statusStyle(a.status)}>{a.status==='verified'?'Verified':a.status==='pending'?'Pending':'Rejected'}</span>
              </div>
            ))}
          </div>

          {/* Active Goals */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <span style={{ fontSize:14, fontWeight:700, color:S.tx }}>Active Goals</span>
              <Link href="/goals/create" style={{ fontSize:12, color:S.blue, fontWeight:600, textDecoration:'none' }}>+ New goal</Link>
            </div>
            {data.goals.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px 0', color:S.mu, fontSize:13 }}>
                No active goals — <Link href="/goals/create" style={{ color:S.blue }}>create one</Link>
              </div>
            ) : data.goals.map((g: any, i: number) => {
              const pct = g.target_value > 0 ? Math.min(100, Math.round((g.current_value / g.target_value) * 100)) : 0
              const color = typeColor(g.goal_type)
              return (
                <div key={i} style={{ marginBottom: i<data.goals.length-1 ? 16 : 0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:13, fontWeight:500, color:S.tx }}>{g.title}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color, fontWeight:600 }}>{pct}%</span>
                  </div>
                  <div style={{ height:6, background:S.s3, borderRadius:3, overflow:'hidden', margin:'7px 0' }}>
                    <div style={{ width:`${pct}%`, height:'100%', borderRadius:3, background:color }} />
                  </div>
                  <div style={{ fontSize:11, color:S.mu }}>
                    <span style={{ background:S.s3, border:`1px solid ${S.bd}`, padding:'2px 8px', borderRadius:10, marginRight:7, fontSize:10, fontWeight:500 }}>
                      {g.goal_type ?? 'Goal'}
                    </span>
                    {g.current_value}/{g.target_value}
                    {g.deadline ? ` · ${new Date(g.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric'})}` : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Rank card */}
          <div style={{ background:S.navy, borderRadius:10, padding:20 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.45)', letterSpacing:'0.06em', marginBottom:14 }}>YOUR RANK</div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ width:46, height:46, background:S.gold, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:S.navy, flexShrink:0 }}>
                {rankLabel.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2)}
              </div>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:'#fff' }}>{rankLabel}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:1 }}>{data.rate}% verified this month</div>
              </div>
            </div>
            <div style={{ height:6, background:'rgba(255,255,255,0.1)', borderRadius:3, overflow:'hidden', marginBottom:6 }}>
              <div style={{ width:`${Math.min(100, data.rate)}%`, height:'100%', background:S.gold, borderRadius:3 }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Verification rate</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:S.gold, fontWeight:600 }}>{data.rate}%</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:12 }}>Quick Actions</div>
            {[
              { label:'+ Submit Activity',  href:'/activities/submit', bg:S.navy, color:'#fff',  border:'none'                },
              { label:'+ Create Goal',      href:'/goals/create',      bg:S.s1,   color:S.tx2,   border:`1px solid ${S.bd}`  },
              { label:'View Leaderboard',   href:'/leaderboard',       bg:S.s1,   color:S.tx2,   border:`1px solid ${S.bd}`  },
            ].map((b,i) => (
              <Link key={b.href} href={b.href} style={{
                display:'block', padding:'9px 16px', borderRadius:8, marginBottom:i<2?8:0,
                background:b.bg, color:b.color, border:b.border,
                fontSize:13, fontWeight:600, textAlign:'center', textDecoration:'none',
              }}>{b.label}</Link>
            ))}
          </div>

          {/* AI Coach tip */}
          <div style={{ background:S.navy2, borderRadius:10, padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#60A5FA' }} />
              <span style={{ fontSize:11, fontWeight:700, color:'#60A5FA', letterSpacing:'0.05em' }}>AI COACH</span>
            </div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.65, marginBottom:12 }}>
              {data.rate < 60
                ? <>Verified rate <strong style={{ color:'#fff' }}>{data.rate}%</strong> — below target of 60%. Focus on submitting activities with proof attached.</>
                : <>Your performance looks strong! Keep submitting consistently to maintain your ranking.</>
              }
            </div>
            <Link href="/ai-coach" style={{ fontSize:12, color:'#60A5FA', fontWeight:600, textDecoration:'none' }}>Open AI Coach →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
