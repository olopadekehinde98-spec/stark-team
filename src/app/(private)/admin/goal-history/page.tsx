/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState, useEffect, useCallback } from 'react'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
  warn:'#D97706', warnBg:'#FFFBEB', warnBd:'#FCD34D',
  blue:'#2563EB', blueBg:'#EFF6FF', blueBd:'#BFDBFE',
}

const STATUS_STYLE: Record<string, { bg: string; bd: string; color: string; icon: string }> = {
  active:    { bg: S.okBg,   bd: S.okBd,   color: S.ok,   icon: '✅' },
  completed: { bg: S.goldBg, bd: S.goldBd, color: S.gold, icon: '🏁' },
  rejected:  { bg: S.errBg,  bd: S.errBd,  color: S.err,  icon: '✕'  },
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_STYLE[status] ?? { bg: S.s3, bd: S.bd, color: S.mu, icon: '?' }
  return (
    <span style={{
      fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20,
      background:c.bg, border:`1px solid ${c.bd}`, color:c.color,
      display:'inline-flex', alignItems:'center', gap:4,
    }}>
      {c.icon} {status.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}
    </span>
  )
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

export default function GoalHistoryPage() {
  const [goals,   setGoals]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState<'all'|'active'|'rejected'|'completed'>('all')
  const [search,  setSearch]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const res  = await fetch('/api/admin/goal-history')
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to load'); setLoading(false); return }
    setGoals(data.goals ?? [])
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const filtered = goals.filter(g => {
    if (filter !== 'all' && g.status !== filter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return g.title?.toLowerCase().includes(q) || g.owner?.full_name?.toLowerCase().includes(q)
    }
    return true
  })

  const counts = {
    all:       goals.length,
    active:    goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    rejected:  goals.filter(g => g.status === 'rejected').length,
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Goal History</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>
          All accepted, completed and rejected goals from the last <strong>7 days</strong> — for verification purposes.
          Records older than 7 days are automatically removed from this view.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total (7 days)', value: counts.all,       color: S.navy },
          { label:'Accepted',       value: counts.active,    color: S.ok   },
          { label:'Completed',      value: counts.completed, color: S.gold },
          { label:'Rejected',       value: counts.rejected,  color: S.err  },
        ].map(s => (
          <div key={s.label} style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:'14px 16px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:S.tx2, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', background:S.s3, borderRadius:8, padding:3, gap:2 }}>
          {(['all','active','completed','rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'7px 14px', borderRadius:6, border:'none', cursor:'pointer',
              fontSize:12, fontWeight:700,
              background: filter === f ? S.navy : 'transparent',
              color:      filter === f ? '#fff' : S.tx2,
            }}>
              {f === 'all' ? `All (${counts.all})` : f === 'active' ? `Accepted (${counts.active})` : f === 'completed' ? `Completed (${counts.completed})` : `Rejected (${counts.rejected})`}
            </button>
          ))}
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or member…"
          style={{ flex:1, minWidth:180, padding:'8px 13px', borderRadius:8, border:`1px solid ${S.bd}`, background:S.s1, fontSize:13, color:S.tx, outline:'none' }}
        />
        <button onClick={load} style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${S.bd}`, background:S.s1, cursor:'pointer', fontSize:13, color:S.tx2 }}>↺ Refresh</button>
      </div>

      {/* Info banner */}
      <div style={{ background:S.blueBg, border:`1px solid ${S.blueBd}`, borderRadius:8, padding:'10px 14px', fontSize:13, color:S.blue, marginBottom:16 }}>
        ℹ️ This page is for <strong>verification purposes only</strong>. Goals that were accepted or rejected more than 7 days ago no longer appear here.
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', height:140, alignItems:'center' }}>
          <div style={{ width:28, height:28, borderRadius:'50%', border:`3px solid ${S.bd}`, borderTop:`3px solid ${S.navy}`, animation:'spin .8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : error ? (
        <div style={{ background:S.errBg, border:`1px solid ${S.errBd}`, borderRadius:10, padding:20, color:S.err, fontSize:13 }}>⚠ {error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 0', color:S.mu, fontSize:14 }}>
          {goals.length === 0 ? 'No goal decisions in the last 7 days.' : 'No results match your filter.'}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(g => (
            <div key={g.id} style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:14, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:5 }}>{g.title}</div>
                  <div style={{ fontSize:12, color:S.tx2, marginBottom:8, lineHeight:1.6 }}>
                    <strong>{g.owner?.full_name ?? 'Unknown'}</strong>
                    {g.owner?.rank ? ` · ${g.owner.rank.replace(/_/g,' ').replace(/\b\w/g,(c: string)=>c.toUpperCase())}` : ''}
                    {' · '}
                    {g.goal_type} goal
                    {g.category ? ` · ${g.category}` : ''}
                  </div>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                    <StatusBadge status={g.status} />
                    {g.deadline && (
                      <span style={{ fontSize:11, color:S.mu }}>
                        Deadline: {new Date(g.deadline).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:11, color:S.mu, marginBottom:3 }}>Updated</div>
                  <div style={{ fontSize:12, fontWeight:600, color:S.tx2 }}>
                    {g.updated_at ? fmt(g.updated_at) : fmt(g.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
