'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Activity = {
  id: string; title: string; activity_type: string; activity_date: string
  proof_url?: string; proof_type?: string; submitted_at: string; user_id: string
  users: { full_name: string; rank: string; username: string }
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function VerifyCard({
  activity, onAction,
}: {
  activity: Activity
  onAction: (id: string, action: 'verify' | 'reject' | 'skip') => void
}) {
  const [notes, setNotes] = useState('')
  const u = activity.users
  const waitH = Math.round((Date.now() - new Date(activity.submitted_at).getTime()) / 3600000)

  return (
    <div className="panel panel-bracket" style={{
      borderLeft: '2px solid var(--cyan)',
      marginBottom: 12,
    }}>
      {/* cyan top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'var(--cyan)',
      }} />

      <div style={{ padding: 16, display: 'flex', gap: 16 }}>
        {/* Left: member info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div className="hexagon" style={{
              width: 36, height: 36, background: 'var(--s2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                fontSize: 12, color: 'var(--gold)',
              }}>{initials(u.full_name)}</span>
            </div>
            <div>
              <div style={{
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--text-primary)',
              }}>{u.full_name}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                <span className="pill pill-active">{u.rank.replace(/_/g, ' ')}</span>
                <span className="pill pill-pending">{activity.activity_type}</span>
              </div>
            </div>
          </div>

          <div style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14,
            fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4,
          }}>{activity.title}</div>

          <div className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 12 }}>
            DATE: {new Date(activity.activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>

          {/* Reject notes */}
          <div>
            <div className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 4 }}>
              REJECTION NOTES (OPTIONAL)
            </div>
            <input
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Reason for rejection..."
              style={{
                width: '100%', padding: '7px 10px', fontSize: 12,
                fontFamily: 'Barlow Condensed, sans-serif',
                background: 'var(--s2)', border: '1px solid var(--b2)',
                color: 'var(--text-primary)', outline: 'none',
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => onAction(activity.id, 'verify')} style={{
              padding: '8px 16px', background: 'rgba(61,220,132,0.10)',
              border: '1px solid rgba(61,220,132,0.30)', color: 'var(--success)',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>✓ VERIFY</button>

            <button onClick={() => onAction(activity.id, 'reject')} style={{
              padding: '8px 16px', background: 'rgba(232,48,64,0.10)',
              border: '1px solid rgba(232,48,64,0.30)', color: 'var(--danger)',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>✕ REJECT</button>

            <button onClick={() => onAction(activity.id, 'skip')} style={{
              padding: '8px 16px', background: 'transparent',
              border: '1px solid var(--b2)', color: 'var(--text-muted)',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
              fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>SKIP</button>
          </div>
        </div>

        {/* Right: proof + timestamp */}
        <div style={{ width: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {activity.proof_url ? (
            <a href={activity.proof_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{
                width: '100%', height: 100, background: 'var(--s2)',
                border: '1px solid var(--b2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <div className="font-mono" style={{ fontSize: 8, color: 'var(--success)', letterSpacing: '0.12em', textAlign: 'center' }}>
                  [PROOF ATTACHED]<br />
                  <span style={{ color: 'var(--text-muted)' }}>{activity.proof_type?.toUpperCase()}</span>
                </div>
              </div>
            </a>
          ) : (
            <div style={{
              width: '100%', height: 100, background: 'var(--s2)',
              border: '1px solid var(--b1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                NO PROOF
              </div>
            </div>
          )}
          <div className="font-mono" style={{
            fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.08em',
            marginTop: 8, textAlign: 'right',
          }}>
            SUBMITTED<br />
            <span style={{ color: 'var(--text-secondary)' }}>
              {new Date(activity.submitted_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span><br />
            <span style={{ color: waitH > 12 ? 'var(--warning)' : 'var(--text-muted)' }}>
              {waitH}H AGO
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyQueueClient({
  activities: initialActivities, currentUserId, verifiedToday, avgWaitHours,
}: {
  activities: Activity[]; currentUserId: string; verifiedToday: number; avgWaitHours: number
}) {
  const [queue, setQueue] = useState(initialActivities)
  const [processing, setProcessing] = useState<string | null>(null)

  async function handleAction(id: string, action: 'verify' | 'reject' | 'skip') {
    if (action === 'skip') {
      setQueue(q => q.filter(a => a.id !== id))
      return
    }
    setProcessing(id)
    const supabase = createClient()
    const url = `/api/verification/${id}/${action}`
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verifier_id: currentUserId }),
    })
    setQueue(q => q.filter(a => a.id !== id))
    setProcessing(null)
  }

  const count = queue.length

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>

      {/* ── HEADER ───────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
          fontSize: 22, textTransform: 'uppercase', letterSpacing: '0.10em',
          color: 'var(--text-primary)',
        }}>VERIFICATION QUEUE</h1>
        <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', marginTop: 2 }}>
          REVIEW AND ACTION PENDING SUBMISSIONS FROM YOUR BRANCH
        </div>
      </div>

      {/* ── 3 STAT BLOCKS ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'QUEUE TOTAL',      value: count,            color: 'var(--cyan)'    },
          { label: 'VERIFIED TODAY',   value: verifiedToday,    color: 'var(--success)' },
          { label: 'AVG WAIT',         value: `${avgWaitHours}H`, color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="panel" style={{ borderLeft: `2px solid ${s.color}`, padding: '14px 16px' }}>
            <div className="font-mono" style={{ fontSize: 8, letterSpacing: '0.18em', color: 'var(--text-muted)', marginBottom: 8 }}>
              {s.label}
            </div>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 26, color: s.color, lineHeight: 1,
            }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── QUEUE ────────────────────────────────── */}
      {queue.length === 0 ? (
        <div className="panel" style={{ padding: '48px 0', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            fontSize: 16, color: 'var(--success)', letterSpacing: '0.15em',
            textTransform: 'uppercase', marginBottom: 4,
          }}>QUEUE CLEAR</div>
          <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
            ALL SUBMISSIONS HAVE BEEN REVIEWED
          </div>
        </div>
      ) : (
        <div>
          {queue.map(act => (
            <VerifyCard
              key={act.id}
              activity={act}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}
