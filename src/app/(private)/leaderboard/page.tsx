'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
}

const PALETTES = [
  { bg:'#FEF9EC', tx:'#D4A017', bd:'#F5D87A' },
  { bg:'#EFF6FF', tx:'#2563EB', bd:'#BFDBFE' },
  { bg:'#F0FDF4', tx:'#16A34A', bd:'#86EFAC' },
  { bg:'#F5F3FF', tx:'#7C3AED', bd:'#DDD6FE' },
  { bg:'#FEF2F2', tx:'#DC2626', bd:'#FCA5A5' },
]

const MEDAL = ['🥇','🥈','🥉']
const PERIODS = [
  { key:'weekly',  label:'This Week' },
  { key:'monthly', label:'This Month' },
  { key:'daily',   label:'Today' },
  { key:'alltime', label:'All Time' },
]

const RANK_LABEL: Record<string, string> = {
  distributor:'Distributor', manager:'Manager',
  senior_manager:'Senior Manager', executive_manager:'Executive', director:'Director',
}

function initials(name: string) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function LeaderboardPage() {
  const [period,   setPeriod]   = useState('weekly')
  const [entries,  setEntries]  = useState<any[]>([])
  const [myId,     setMyId]     = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setMyId(user.id)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leaderboard/live?period=${period}`)
      .then(r => r.json())
      .then(d => { setEntries(d.entries ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const myEntry = entries.find(e => e.id === myId)
  const maxScore = entries[0]?.score ?? 1

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Leaderboard</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>
          {myEntry
            ? `Your position: #${myEntry.rank_position} · ${myEntry.score} pts`
            : 'Live team performance rankings'}
        </p>
      </div>

      {/* Period tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:4 }}>
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)} style={{
            flex:1, padding:'7px 0', borderRadius:7, border:'none', cursor:'pointer',
            fontSize:13, fontWeight:600,
            background: period === p.key ? S.navy : 'transparent',
            color:      period === p.key ? '#fff' : S.tx2,
          }}>{p.label}</button>
        ))}
      </div>

      {/* My position banner */}
      {myEntry && (
        <div style={{ background:S.goldBg, border:`1px solid ${S.goldBd}`, borderRadius:10, padding:'12px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ fontSize:22 }}>{myEntry.rank_position <= 3 ? MEDAL[myEntry.rank_position - 1] : `#${myEntry.rank_position}`}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:S.navy }}>You are #{myEntry.rank_position} this {period === 'weekly' ? 'week' : period === 'daily' ? 'today' : period === 'monthly' ? 'month' : 'all time'}</div>
            <div style={{ fontSize:12, color:S.tx2, marginTop:2 }}>{myEntry.score} points · keep logging activities to climb!</div>
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:22, fontWeight:800, color:S.gold }}>{myEntry.score}</div>
        </div>
      )}

      {/* Rankings list */}
      <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ padding:48, textAlign:'center', color:S.mu, fontSize:13 }}>Calculating rankings…</div>
        ) : entries.length === 0 ? (
          <div style={{ padding:48, textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🏆</div>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:6 }}>No activities yet</div>
            <div style={{ fontSize:13, color:S.mu }}>Submit activities to appear on the leaderboard</div>
          </div>
        ) : entries.map((e, i) => {
          const isMe  = e.id === myId
          const pal   = PALETTES[i % PALETTES.length]
          const barW  = maxScore > 0 ? Math.round((e.score / maxScore) * 100) : 0

          return (
            <div key={e.id} style={{
              padding:'14px 18px',
              borderBottom: i < entries.length - 1 ? `1px solid ${S.bd}` : 'none',
              background: isMe ? S.goldBg : 'transparent',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                {/* Position */}
                <div style={{ width:32, textAlign:'center', flexShrink:0 }}>
                  {i < 3
                    ? <span style={{ fontSize:20 }}>{MEDAL[i]}</span>
                    : <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:S.mu }}>#{i+1}</span>
                  }
                </div>

                {/* Avatar */}
                {e.avatar_url ? (
                  <img src={e.avatar_url} width={36} height={36} style={{ borderRadius:'50%', objectFit:'cover', border:`2px solid ${isMe ? S.gold : S.bd}`, flexShrink:0 }} alt="" />
                ) : (
                  <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, background: isMe ? S.gold : pal.bg, border:`1px solid ${isMe ? S.goldBd : pal.bd}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color: isMe ? S.navy : pal.tx }}>
                    {initials(e.full_name)}
                  </div>
                )}

                {/* Name + rank + bar */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:S.tx }}>
                      {e.full_name}{isMe && <span style={{ fontSize:10, color:S.gold, fontWeight:700, marginLeft:6 }}>· You</span>}
                    </span>
                    <span style={{ fontSize:10, color:S.mu, background:S.s3, border:`1px solid ${S.bd}`, padding:'1px 7px', borderRadius:20 }}>
                      {RANK_LABEL[e.rank] ?? e.rank}
                    </span>
                  </div>
                  {/* Score bar */}
                  <div style={{ height:5, background:S.s3, borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${barW}%`, height:'100%', background: i === 0 ? S.gold : i === 1 ? '#94A3B8' : i === 2 ? '#D97706' : isMe ? S.gold : '#CBD5E1', borderRadius:3 }} />
                  </div>
                </div>

                {/* Score */}
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:800, color: i < 3 ? S.gold : isMe ? S.gold : S.tx }}>
                    {e.score}
                  </div>
                  <div style={{ fontSize:10, color:S.mu }}>pts</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Scoring legend */}
      <div style={{ display:'flex', gap:16, marginTop:14, justifyContent:'center' }}>
        {[
          { color:S.ok,      label:'Verified = 1.0 pt' },
          { color:'#D97706', label:'Unverified = 0.2 pt' },
          { color:S.mu,      label:'Rejected = 0 pts' },
        ].map(l => (
          <span key={l.label} style={{ fontSize:11, color:S.mu, display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:l.color, display:'inline-block' }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  )
}
