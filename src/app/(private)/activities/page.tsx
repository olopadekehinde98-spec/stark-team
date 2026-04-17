'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Activity = {
  id: string; title: string; activity_type: string; activity_date: string
  status: string; submitted_at: string; edit_locked_at?: string; proof_url?: string
}
type FilterTab = 'all' | 'pending' | 'verified' | 'rejected'

function StatusPill({ status }: { status: string }) {
  const cls: Record<string, string> = {
    verified: 'pill pill-verified', pending: 'pill pill-pending',
    rejected: 'pill pill-rejected', unverified: 'pill pill-unverified',
  }
  return <span className={cls[status] ?? 'pill pill-unverified'}>{status}</span>
}

function EditCountdown({ submittedAt }: { submittedAt: string }) {
  const [remain, setRemain] = useState('')

  useEffect(() => {
    const tick = () => {
      const ms = 24 * 3600000 - (Date.now() - new Date(submittedAt).getTime())
      if (ms <= 0) { setRemain(''); return }
      const h = Math.floor(ms / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setRemain(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [submittedAt])

  return remain ? (
    <span className="font-mono" style={{ fontSize: 9, color: 'var(--warning)', letterSpacing: '0.05em' }}>
      {remain}
    </span>
  ) : null
}

function hoursLeft(submittedAt: string) {
  return Math.max(0, (24 * 3600000 - (Date.now() - new Date(submittedAt).getTime())) / 3600000)
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<FilterTab>('all')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('activities')
        .select('id,title,activity_type,activity_date,status,submitted_at,edit_locked_at,proof_url')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(60)
      setActivities(data ?? [])
      setLoading(false)
    })
  }, [])

  const filtered  = filter === 'all' ? activities : activities.filter(a => a.status === filter)
  const total     = activities.length
  const verified  = activities.filter(a => a.status === 'verified').length
  const pending   = activities.filter(a => a.status === 'pending').length
  const rejected  = activities.filter(a => a.status === 'rejected').length

  const editableActs = activities.filter(a => a.status === 'pending' && hoursLeft(a.submitted_at) > 0)

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all',      label: 'ALL',      count: total    },
    { key: 'pending',  label: 'PENDING',  count: pending  },
    { key: 'verified', label: 'VERIFIED', count: verified },
    { key: 'rejected', label: 'REJECTED', count: rejected },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: '0 auto' }}>

      {/* ── HEADER ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            fontSize: 22, textTransform: 'uppercase', letterSpacing: '0.10em',
            color: 'var(--text-primary)',
          }}>FIELD REPORTS</h1>
          <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', marginTop: 2 }}>
            SUBMITTED ACTIVITY LOG
          </div>
        </div>
        <Link href="/activities/submit" style={{
          display: 'inline-block', padding: '10px 20px',
          background: 'var(--gold)', color: '#03060A',
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
          fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase',
          textDecoration: 'none', border: 'none',
        }}>+ SUBMIT ACTIVITY</Link>
      </div>

      {/* ── EDIT WINDOW BANNER ───────────────────── */}
      {editableActs.length > 0 && (
        <div style={{
          padding: '10px 16px', marginBottom: 16,
          background: 'var(--gold-dim)',
          border: '1px solid var(--gold-border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div className="blink-dot" style={{
            width: 6, height: 6, background: 'var(--gold)', borderRadius: '50%',
            boxShadow: '0 0 6px var(--gold)', animation: 'pulse-green 2s ease-in-out infinite',
          }} />
          <div className="font-mono" style={{ fontSize: 9, color: 'var(--gold)', letterSpacing: '0.12em' }}>
            EDIT WINDOW ACTIVE |{' '}
            <span style={{ color: 'var(--text-primary)' }}>{editableActs[0].title.toUpperCase()}</span>
            {' '}|{' '}
            <EditCountdown submittedAt={editableActs[0].submitted_at} /> REMAINING
          </div>
        </div>
      )}

      {/* ── STAT STRIP ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'TOTAL',    value: total,    color: 'var(--gold)'    },
          { label: 'VERIFIED', value: verified, color: 'var(--success)' },
          { label: 'PENDING',  value: pending,  color: 'var(--cyan)'    },
          { label: 'REJECTED', value: rejected, color: 'var(--danger)'  },
        ].map(s => (
          <div key={s.label} className="panel" style={{ padding: '12px 14px' }}>
            <div className="font-mono" style={{ fontSize: 8, letterSpacing: '0.18em', color: 'var(--text-muted)', marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 24, color: s.color, lineHeight: 1,
            }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── FILTER TABS ──────────────────────────── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
        {TABS.map(tab => (
          <button key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '6px 16px',
              background: filter === tab.key ? 'var(--s2)' : 'transparent',
              border: filter === tab.key ? '1px solid var(--b3)' : '1px solid var(--b1)',
              color: filter === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 0.12s',
            }}>
            {tab.label}
            <span style={{ marginLeft: 8, opacity: 0.6 }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ── TABLE ────────────────────────────────── */}
      {loading ? (
        <div className="panel" style={{ padding: '48px 0', textAlign: 'center' }}>
          <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
            RETRIEVING FIELD REPORTS...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ padding: '48px 0', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            fontSize: 16, color: 'var(--text-muted)', letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 8,
          }}>
            {filter === 'all' ? 'NO ACTIVITIES RECORDED' : `NO ${filter.toUpperCase()} ACTIVITIES`}
          </div>
          {filter === 'all' && (
            <Link href="/activities/submit" style={{
              display: 'inline-block', marginTop: 8, padding: '8px 20px',
              background: 'var(--gold)', color: '#03060A',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 12, letterSpacing: '0.15em', textDecoration: 'none',
            }}>SUBMIT FIRST REPORT</Link>
          )}
        </div>
      ) : (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead className="tbl-header">
              <tr>
                {['ACTIVITY', 'TYPE', 'DATE', 'PROOF', 'STATUS', 'ACTION'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const hrs     = hoursLeft(a.submitted_at)
                const editable = hrs > 0 && a.status === 'pending'
                return (
                  <tr key={a.id} className="tbl-row"
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--b1)' : 'none' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <Link href={`/activities/${a.id}`} style={{
                        color: 'var(--text-primary)', fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: 13, fontWeight: 500, textDecoration: 'none',
                      }}>
                        {a.title}
                      </Link>
                      {editable && (
                        <span className="font-mono" style={{
                          marginLeft: 8, fontSize: 8,
                          padding: '1px 5px', background: 'var(--gold-dim)',
                          border: '1px solid var(--gold-border)', color: 'var(--gold)',
                          letterSpacing: '0.08em',
                        }}>EDITABLE</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {a.activity_type}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                        {new Date(a.activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {a.proof_url
                        ? <a href={a.proof_url} target="_blank" rel="noopener noreferrer"
                            className="font-mono" style={{ fontSize: 9, color: 'var(--success)', letterSpacing: '0.08em' }}>
                            [VIEW]
                          </a>
                        : <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusPill status={a.status} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link href={`/activities/${a.id}`} style={{
                        fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
                        color: 'var(--text-muted)', border: '1px solid var(--b2)',
                        padding: '4px 10px', textDecoration: 'none',
                        letterSpacing: '0.08em', display: 'inline-block',
                      }}>VIEW</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
