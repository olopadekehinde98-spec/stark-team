'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const S = {
  s1:'#FFFFFF',s2:'#F8FAFC',s3:'#EEF2F7',bd:'#E2E8F0',
  navy:'#0F1C2E',navy2:'#1E3A5F',gold:'#D4A017',goldBg:'#FEF9EC',goldBd:'#F5D87A',
  tx:'#0F172A',tx2:'#475569',mu:'#94A3B8',
  ok:'#16A34A',okBg:'#F0FDF4',okBd:'#86EFAC',
  warn:'#D97706',err:'#DC2626',blue:'#2563EB',blueBg:'#EFF6FF',
}

const BADGE_DEFS = [
  { id:'first_activity', label:'First Activity',   icon:'⚡', color:'#D4A017' },
  { id:'verified_10',    label:'10 Verified',       icon:'✓',  color:'#16A34A' },
  { id:'top_10',         label:'Top 10 Rank',       icon:'🏆', color:'#2563EB' },
  { id:'goal_setter',    label:'Goal Setter',       icon:'◎',  color:'#7C3AED' },
  { id:'streak_7',       label:'7-Day Streak',      icon:'🔥', color:'#DC2626' },
]

export default function ProfilePage() {
  const [profile,  setProfile]  = useState<any>(null)
  const [stats,    setStats]    = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [editing,  setEditing]  = useState(false)
  const [form,     setForm]     = useState({ full_name:'', username:'', bio:'' })
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [profRes, actsRes, goalsRes, lbRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('activities').select('status,title,activity_type,submitted_at').eq('user_id', user.id).order('submitted_at',{ascending:false}).limit(5),
        supabase.from('goals').select('status').eq('user_id', user.id),
        supabase.from('leaderboard_snapshots').select('rank_position').eq('user_id', user.id).eq('period','monthly').order('snapshot_date',{ascending:false}).limit(1).maybeSingle(),
      ])

      const prof = profRes.data
      const acts = actsRes.data ?? []
      const verified = acts.filter((a: any) => a.status === 'verified').length
      const goalsDone = (goalsRes.data ?? []).filter((g: any) => g.status === 'completed').length
      const rate = acts.length > 0 ? Math.round((verified / acts.length) * 100) : 0

      setProfile(prof)
      setStats({ total: acts.length, verified, rate, goalsDone, lb: lbRes.data?.rank_position ?? null })
      setActivities(acts)
      setForm({ full_name: prof?.full_name ?? '', username: prof?.username ?? '', bio: prof?.bio ?? '' })
      setLoading(false)
    })()
  }, [])

  async function handleSave() {
    setSaving(true); setMsg('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('users').update({ full_name: form.full_name, username: form.username, bio: form.bio }).eq('id', user.id)
    if (error) setMsg(error.message)
    else { setProfile((p: any) => ({ ...p, ...form })); setEditing(false); setMsg('Profile updated!') }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:`3px solid ${S.bd}`, borderTop:`3px solid ${S.navy}`, animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!profile) return null

  const initials   = profile.full_name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2) ?? '??'
  const rankLabel  = (profile.rank ?? 'member').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  const badgesEarned = BADGE_DEFS.filter(b => {
    if (b.id === 'first_activity') return (stats?.total ?? 0) >= 1
    if (b.id === 'verified_10')    return (stats?.verified ?? 0) >= 10
    if (b.id === 'top_10')         return stats?.lb && stats.lb <= 10
    if (b.id === 'goal_setter')    return (stats?.goalsDone ?? 0) >= 1
    return false
  })

  const statusStyle = (s: string) => ({
    fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20,
    background: s==='verified' ? S.okBg : s==='pending' ? S.blueBg : '#FEF2F2',
    color:      s==='verified' ? S.ok   : s==='pending' ? S.blue   : S.err,
    border:    `1px solid ${s==='verified' ? S.okBd : s==='pending' ? '#BFDBFE' : '#FCA5A5'}`,
  })

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Hero banner */}
      <div style={{ background:S.navy, borderRadius:12, padding:'28px 28px 24px', marginBottom:18, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(212,160,23,0.08)', pointerEvents:'none' }} />
        <div style={{ display:'flex', alignItems:'center', gap:18 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:S.gold, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:S.navy, flexShrink:0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:4 }}>{profile.full_name}</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)' }}>@{profile.username} · {rankLabel}</div>
            {profile.bio && <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>{profile.bio}</div>}
          </div>
          <button onClick={() => setEditing(!editing)} style={{
            marginLeft:'auto', padding:'8px 16px', borderRadius:8,
            background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)',
            color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer',
          }}>{editing ? 'Cancel' : 'Edit Profile'}</button>
        </div>

        {/* Stats row */}
        <div style={{ display:'flex', gap:24, marginTop:22, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          {[
            { label:'Verified Acts', value: stats?.verified ?? 0 },
            { label:'Verified Rate', value: `${stats?.rate ?? 0}%` },
            { label:'Leaderboard',   value: stats?.lb ? `#${stats.lb}` : '—' },
            { label:'Goals Done',    value: stats?.goalsDone ?? 0 },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize:20, fontWeight:800, color:S.gold, fontFamily:"'JetBrains Mono',monospace" }}>{s.value}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:20, marginBottom:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:16 }}>Edit Profile</div>
          {msg && <div style={{ marginBottom:12, fontSize:13, color:msg.includes('!')?S.ok:S.err }}>{msg}</div>}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            {[
              { label:'Full Name', key:'full_name' },
              { label:'Username',  key:'username'  },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize:11, fontWeight:600, color:S.tx2, marginBottom:6 }}>{f.label}</div>
                <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:`1px solid ${S.bd}`, background:S.s2, fontSize:13, color:S.tx, fontFamily:"'Inter',sans-serif" }}
                />
              </div>
            ))}
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:600, color:S.tx2, marginBottom:6 }}>Bio</div>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3}
              style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:`1px solid ${S.bd}`, background:S.s2, fontSize:13, color:S.tx, fontFamily:"'Inter',sans-serif", resize:'vertical' }}
            />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleSave} disabled={saving} style={{
              padding:'9px 20px', borderRadius:8, background:S.navy,
              color:'#fff', fontSize:13, fontWeight:600, border:'none', cursor:'pointer',
            }}>{saving ? 'Saving…' : 'Save Changes'}</button>
            <button onClick={() => setEditing(false)} style={{
              padding:'9px 20px', borderRadius:8, background:S.s3,
              color:S.tx2, fontSize:13, fontWeight:600, border:`1px solid ${S.bd}`, cursor:'pointer',
            }}>Discard</button>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
        {/* Left */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Recent Activities */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:14 }}>Recent Activities</div>
            {activities.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:S.mu, fontSize:13 }}>No activities yet</div>
            ) : activities.map((a: any, i: number, arr: any[]) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:i<arr.length-1?`1px solid ${S.bd}`:'none' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:a.status==='verified'?S.ok:a.status==='pending'?S.blue:S.err, flexShrink:0 }} />
                <span style={{ flex:1, fontSize:13, fontWeight:500, color:S.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</span>
                <span style={{ fontSize:11, color:S.mu, marginRight:8, flexShrink:0 }}>
                  {new Date(a.submitted_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                </span>
                <span style={statusStyle(a.status)}>{a.status.charAt(0).toUpperCase()+a.status.slice(1)}</span>
              </div>
            ))}
          </div>

          {/* Badges */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:14 }}>Badges</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
              {BADGE_DEFS.map(b => {
                const earned = badgesEarned.some(e => e.id === b.id)
                return (
                  <div key={b.id} style={{
                    display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
                    borderRadius:8, border:`1px solid ${earned ? b.color+'40' : S.bd}`,
                    background: earned ? b.color+'10' : S.s3,
                    opacity: earned ? 1 : 0.5,
                  }}>
                    <span style={{ fontSize:16 }}>{b.icon}</span>
                    <span style={{ fontSize:12, fontWeight:600, color: earned ? b.color : S.mu }}>{b.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Rank progress */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', borderTop:`3px solid ${S.gold}` }}>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:14 }}>Rank Progress</div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ width:44, height:44, borderRadius:8, background:S.goldBg, border:`1px solid ${S.goldBd}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:S.gold }}>
                {initials.slice(0,1)}
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:S.tx }}>{rankLabel}</div>
                <div style={{ fontSize:11, color:S.mu }}>Current rank</div>
              </div>
            </div>
            <div style={{ height:6, background:S.s3, borderRadius:3, overflow:'hidden', marginBottom:6 }}>
              <div style={{ width:`${Math.min(100, stats?.rate ?? 0)}%`, height:'100%', background:S.gold, borderRadius:3 }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:11, color:S.mu }}>Verification rate</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:S.gold, fontWeight:600 }}>{stats?.rate ?? 0}%</span>
            </div>
          </div>

          {/* Info card */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:12 }}>Account Info</div>
            {[
              { label:'Role',     value: (profile.role ?? 'member').replace(/\b\w/g, (c: string) => c.toUpperCase()) },
              { label:'Member since', value: new Date(profile.created_at).toLocaleDateString('en-US',{month:'long',year:'numeric'}) },
              { label:'Status',   value: profile.is_active ? 'Active' : 'Inactive' },
            ].map((r, i, arr) => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:i<arr.length-1?`1px solid ${S.bd}`:'none' }}>
                <span style={{ fontSize:12, color:S.tx2 }}>{r.label}</span>
                <span style={{ fontSize:12, fontWeight:600, color:S.tx }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
