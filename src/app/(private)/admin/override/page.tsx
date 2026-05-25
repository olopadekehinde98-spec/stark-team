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
  purple:'#7C3AED', purpleBg:'#F5F3FF', purpleBd:'#DDD6FE',
}

type Tab = 'goals' | 'activities'

const STATUS_COLORS: Record<string, { bg: string; bd: string; color: string }> = {
  active:          { bg: S.okBg,     bd: S.okBd,     color: S.ok     },
  completed:       { bg: S.goldBg,   bd: S.goldBd,   color: S.gold   },
  pending_approval:{ bg: S.blueBg,   bd: S.blueBd,   color: S.blue   },
  rejected:        { bg: S.errBg,    bd: S.errBd,    color: S.err    },
  pending:         { bg: S.warnBg,   bd: S.warnBd,   color: S.warn   },
  verified:        { bg: S.okBg,     bd: S.okBd,     color: S.ok     },
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: S.s3, bd: S.bd, color: S.mu }
  return (
    <span style={{
      fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20,
      background:c.bg, border:`1px solid ${c.bd}`, color:c.color,
    }}>
      {status.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}
    </span>
  )
}

export default function AdminOverridePage() {
  const [tab,        setTab]        = useState<Tab>('goals')
  const [goals,      setGoals]      = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading,    setLoading]    = useState(false)
  const [working,    setWorking]    = useState<string | null>(null)
  const [toast,      setToast]      = useState('')
  const [filter,     setFilter]     = useState('')

  const load = useCallback(async (t: Tab) => {
    setLoading(true)
    const res  = await fetch(`/api/admin/override?type=${t}`)
    const data = await res.json()
    if (t === 'goals')      setGoals(data.goals ?? [])
    else                    setActivities(data.activities ?? [])
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(tab) }, [tab, load])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  async function doOverride(type: 'goal' | 'activity', id: string, action: string) {
    setWorking(id + action)
    const res  = await fetch('/api/admin/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, action }),
    })
    setWorking(null)
    if (res.ok) {
      showToast('Override applied successfully.')
      await load(tab)
    } else {
      const d = await res.json()
      showToast('Error: ' + (d.error ?? 'Unknown'))
    }
  }

  const filteredGoals = goals.filter(g =>
    !filter || g.title?.toLowerCase().includes(filter.toLowerCase()) ||
    g.owner?.full_name?.toLowerCase().includes(filter.toLowerCase())
  )
  const filteredActs = activities.filter(a =>
    !filter || a.title?.toLowerCase().includes(filter.toLowerCase()) ||
    a.owner?.full_name?.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', top:80, right:20, zIndex:9999,
          background:S.navy, color:'#fff', borderRadius:10, padding:'12px 18px',
          fontSize:13, fontWeight:600, boxShadow:'0 4px 16px rgba(0,0,0,0.25)',
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Override Panel</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>
          As admin, you can override any accepted goal or submitted activity — including your own.
          Use this to reject, reset, or complete records that need correction.
        </p>
      </div>

      {/* Warning */}
      <div style={{ background:S.errBg, border:`1px solid ${S.errBd}`, borderRadius:10, padding:'12px 16px', marginBottom:20, display:'flex', gap:10, alignItems:'flex-start' }}>
        <span style={{ fontSize:18 }}>⚠️</span>
        <div style={{ fontSize:13, color:S.err, lineHeight:1.6 }}>
          <strong>Admin override is permanent and immediate.</strong> Rejecting a goal or activity cannot be undone unless you reset it.
          Only override records with a valid reason.
        </div>
      </div>

      {/* Tabs + filter */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18, flexWrap:'wrap' }}>
        <div style={{ display:'flex', background:S.s3, borderRadius:8, padding:3, gap:2 }}>
          {(['goals','activities'] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setFilter('') }}
              style={{
                padding:'8px 18px', borderRadius:6, border:'none', cursor:'pointer',
                fontSize:13, fontWeight:700,
                background: tab === t ? S.navy : 'transparent',
                color:      tab === t ? '#fff' : S.tx2,
              }}>
              {t === 'goals' ? '🎯 Goals' : '📋 Activities'}
            </button>
          ))}
        </div>
        <input
          value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Filter by name or member…"
          style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${S.bd}`, fontSize:13, background:S.s1, color:S.tx, outline:'none', flex:1, minWidth:180 }}
        />
        <button onClick={() => load(tab)} style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${S.bd}`, background:S.s1, cursor:'pointer', fontSize:13, color:S.tx2 }}>
          ↺ Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:160 }}>
          <div style={{ width:28, height:28, borderRadius:'50%', border:`3px solid ${S.bd}`, borderTop:`3px solid ${S.navy}`, animation:'spin .8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : tab === 'goals' ? (
        filteredGoals.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:S.mu, fontSize:14 }}>No goals found.</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filteredGoals.map(g => (
              <div key={g.id} style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:4 }}>{g.title}</div>
                    <div style={{ fontSize:12, color:S.tx2, marginBottom:6 }}>
                      <strong>{g.owner?.full_name ?? 'Unknown'}</strong>
                      {g.owner?.rank ? ` · ${g.owner.rank.replace(/_/g,' ')}` : ''}
                      {' · '}
                      {g.goal_type} goal
                      {g.deadline ? ` · due ${new Date(g.deadline).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}` : ''}
                    </div>
                    <StatusBadge status={g.status} />
                  </div>
                  <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
                    {g.status !== 'rejected' && (
                      <button
                        disabled={!!working}
                        onClick={() => doOverride('goal', g.id, 'reject')}
                        style={{
                          padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:700,
                          background: working === g.id+'reject' ? S.mu : S.errBg,
                          color: working === g.id+'reject' ? '#fff' : S.err,
                          border:`1px solid ${S.errBd}`, cursor: working ? 'not-allowed' : 'pointer',
                        }}>
                        {working === g.id+'reject' ? '…' : '✕ Reject'}
                      </button>
                    )}
                    {g.status !== 'pending_approval' && (
                      <button
                        disabled={!!working}
                        onClick={() => doOverride('goal', g.id, 'reset')}
                        style={{
                          padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:700,
                          background: working === g.id+'reset' ? S.mu : S.warnBg,
                          color: working === g.id+'reset' ? '#fff' : S.warn,
                          border:`1px solid ${S.warnBd}`, cursor: working ? 'not-allowed' : 'pointer',
                        }}>
                        {working === g.id+'reset' ? '…' : '↺ Reset to Pending'}
                      </button>
                    )}
                    {g.status !== 'completed' && (
                      <button
                        disabled={!!working}
                        onClick={() => doOverride('goal', g.id, 'complete')}
                        style={{
                          padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:700,
                          background: working === g.id+'complete' ? S.mu : S.okBg,
                          color: working === g.id+'complete' ? '#fff' : S.ok,
                          border:`1px solid ${S.okBd}`, cursor: working ? 'not-allowed' : 'pointer',
                        }}>
                        {working === g.id+'complete' ? '…' : '✓ Mark Complete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        filteredActs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:S.mu, fontSize:14 }}>No activities found.</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filteredActs.map(a => (
              <div key={a.id} style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:4 }}>{a.title}</div>
                    <div style={{ fontSize:12, color:S.tx2, marginBottom:6 }}>
                      <strong>{a.owner?.full_name ?? 'Unknown'}</strong>
                      {a.owner?.rank ? ` · ${a.owner.rank.replace(/_/g,' ')}` : ''}
                      {' · '}
                      {a.activity_type}
                      {a.submitted_at ? ` · submitted ${new Date(a.submitted_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}` : ''}
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
                    {a.status !== 'rejected' && (
                      <button
                        disabled={!!working}
                        onClick={() => doOverride('activity', a.id, 'reject')}
                        style={{
                          padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:700,
                          background: working === a.id+'reject' ? S.mu : S.errBg,
                          color: working === a.id+'reject' ? '#fff' : S.err,
                          border:`1px solid ${S.errBd}`, cursor: working ? 'not-allowed' : 'pointer',
                        }}>
                        {working === a.id+'reject' ? '…' : '✕ Reject'}
                      </button>
                    )}
                    {a.status !== 'pending' && (
                      <button
                        disabled={!!working}
                        onClick={() => doOverride('activity', a.id, 'reset')}
                        style={{
                          padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:700,
                          background: working === a.id+'reset' ? S.mu : S.warnBg,
                          color: working === a.id+'reset' ? '#fff' : S.warn,
                          border:`1px solid ${S.warnBd}`, cursor: working ? 'not-allowed' : 'pointer',
                        }}>
                        {working === a.id+'reset' ? '…' : '↺ Reset to Pending'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
