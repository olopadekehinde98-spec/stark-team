'use client'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

/* ── STAT BLOCK ──────────────────────────────────── */
function StatBlock({ label, value, sub, accentColor }: {
  label: string; value: string | number; sub?: string; accentColor: string
}) {
  return (
    <div className="panel" style={{ borderLeft: `2px solid ${accentColor}`, padding: '16px 18px' }}>
      <div className="font-mono" style={{
        fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase',
        color: 'var(--text-muted)', marginBottom: 8,
      }}>{label}</div>
      <div style={{
        fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
        fontSize: 28, color: accentColor, lineHeight: 1,
      }}>{value}</div>
      {sub && (
        <div className="font-mono" style={{
          fontSize: 9, color: 'var(--text-muted)', marginTop: 6,
        }}>{sub}</div>
      )}
    </div>
  )
}

/* ── PANEL CARD ──────────────────────────────────── */
function PanelCard({ title, action, actionHref, accentColor, children }: {
  title: string; action?: string; actionHref?: string;
  accentColor?: string; children: React.ReactNode
}) {
  return (
    <div className="panel panel-bracket" style={{ position: 'relative' }}>
      {accentColor && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        }} />
      )}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '1px solid var(--b1)',
      }}>
        <div className="font-mono" style={{
          fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>{title}</div>
        {action && actionHref && (
          <Link href={actionHref} style={{
            fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
            color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.10em',
          }}>
            {action} &gt;&gt;
          </Link>
        )}
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  )
}

/* ── STATUS PILL ─────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const cls: Record<string, string> = {
    verified: 'pill pill-verified', pending: 'pill pill-pending',
    rejected: 'pill pill-rejected', unverified: 'pill pill-unverified',
    active: 'pill pill-active', completed: 'pill pill-completed',
    failed: 'pill pill-failed',
  }
  return <span className={cls[status] ?? 'pill pill-unverified'}>{status}</span>
}

/* ── DOT COLOR ───────────────────────────────────── */
const dotColor: Record<string, string> = {
  verified: 'var(--success)', pending: 'var(--cyan)',
  rejected: 'var(--danger)', unverified: 'var(--text-muted)',
}

/* ── DASHBOARD PAGE ──────────────────────────────── */
export default function DashboardPage() {
  const [loading, setLoading]   = useState(true)
  const [profile, setProfile]   = useState<any>(null)
  const [stats, setStats]       = useState<any>({})
  const [recentActs, setActs]   = useState<any[]>([])
  const [goals, setGoals]       = useState<any[]>([])
  const [snaps, setSnaps]       = useState<any[]>([])
  const [tip, setTip]           = useState('')

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const thirtyAgo = new Date(Date.now() - 30 * 864e5).toISOString()

      const [profileRes, actsRes, goalsRes, snapRes, recentRes] = await Promise.all([
        supabase.from('users').select('full_name,role,rank,branch_id').eq('id', user.id).single(),
        supabase.from('activities').select('status').eq('user_id', user.id).gte('submitted_at', thirtyAgo),
        supabase.from('goals').select('id,title,deadline,status,progress_pct').eq('user_id', user.id).eq('status', 'active').limit(4),
        supabase.from('leaderboard_snapshots').select('rank_position,score').eq('user_id', user.id).eq('period', 'monthly').order('snapshot_date', { ascending: false }).limit(2),
        supabase.from('activities').select('id,title,status,activity_type,submitted_at').eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(6),
      ])

      setProfile(profileRes.data)
      setActs(recentRes.data ?? [])
      setGoals(goalsRes.data ?? [])
      setSnaps(snapRes.data ?? [])

      const acts = actsRes.data ?? []
      const verified = acts.filter((a: any) => a.status === 'verified').length
      const pending  = acts.filter((a: any) => a.status === 'pending').length
      const rate     = acts.length > 0 ? Math.round((verified / acts.length) * 100) : 0
      const pos      = snapRes.data?.[0]?.rank_position ?? 0

      setStats({ verified, pending, rate, pos, total: acts.length })

      const tips = [
        'SUBMIT ACTIVITIES WITHIN 24H FOR OPTIMAL VERIFICATION RATE.',
        'ATTACH PROOF TO EVERY ACTIVITY — LEADERS APPROVE 3X FASTER.',
        'SET A WEEKLY GOAL TO MAINTAIN TOP-10 STANDING THIS CYCLE.',
      ]
      setTip(tips[new Date().getDay() % tips.length])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.2em' }}>
          LOADING OPERATIVE DATA...
        </div>
      </div>
    )
  }

  const rankLabel = profile?.rank?.replace(/_/g, ' ').toUpperCase() ?? 'MEMBER'

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>

      {/* ── PAGE HEADER ──────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{
          fontSize: 8, letterSpacing: '0.28em', color: 'var(--text-muted)', marginBottom: 4,
        }}>COMMAND OVERVIEW</div>
        <h1 style={{
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
          fontSize: 26, color: 'var(--text-primary)', textTransform: 'uppercase',
          letterSpacing: '0.08em', lineHeight: 1,
        }}>{profile?.full_name ?? 'OPERATIVE'}</h1>
        <div className="font-mono" style={{
          fontSize: 9, color: 'var(--gold)', letterSpacing: '0.18em', marginTop: 4,
        }}>
          {rankLabel} · {profile?.role?.toUpperCase() ?? 'MEMBER'}
        </div>
      </div>

      {/* ── 4 STAT BLOCKS ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatBlock
          label="ACTIVITIES / 30D"
          value={stats.total}
          sub={`${stats.verified} VERIFIED`}
          accentColor="var(--gold)"
        />
        <StatBlock
          label="VERIFIED RATE"
          value={`${stats.rate}%`}
          sub={`${stats.pending} PENDING REVIEW`}
          accentColor={stats.rate < 60 ? 'var(--warning)' : 'var(--success)'}
        />
        <StatBlock
          label="LEADERBOARD"
          value={stats.pos ? `#${stats.pos}` : '—'}
          sub="MONTHLY RANK"
          accentColor="var(--cyan)"
        />
        <StatBlock
          label="PENDING"
          value={stats.pending}
          sub="AWAITING REVIEW"
          accentColor={stats.pending > 0 ? 'var(--danger)' : 'var(--text-muted)'}
        />
      </div>

      {/* ── TWO COLUMN LAYOUT ────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Activity Log */}
          <PanelCard title="ACTIVITY LOG" action="VIEW ALL" actionHref="/activities">
            {recentActs.length === 0 ? (
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', padding: '16px 0', textAlign: 'center', letterSpacing: '0.15em' }}>
                NO ACTIVITIES RECORDED —{' '}
                <Link href="/activities/submit" style={{ color: 'var(--gold)', textDecoration: 'none' }}>SUBMIT NOW</Link>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {recentActs.map((act, i) => (
                    <tr key={act.id} style={{ borderBottom: i < recentActs.length - 1 ? '1px solid var(--b1)' : 'none' }}>
                      <td style={{ padding: '10px 0', width: 12 }}>
                        <div style={{
                          width: 6, height: 6,
                          background: dotColor[act.status] ?? 'var(--text-muted)',
                        }} />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{
                          fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13,
                          fontWeight: 500, color: 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          maxWidth: 260,
                        }}>{act.title}</div>
                        <div style={{
                          fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11,
                          color: 'var(--text-muted)', marginTop: 2,
                        }}>{act.activity_type}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div className="font-mono" style={{
                          fontSize: 9, color: 'var(--text-muted)',
                        }}>
                          {new Date(act.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      <td style={{ padding: '10px 0', textAlign: 'right' }}>
                        <StatusPill status={act.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </PanelCard>

          {/* Goals */}
          <PanelCard title="ACTIVE OBJECTIVES" action="VIEW ALL" actionHref="/goals">
            {goals.length === 0 ? (
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', padding: '16px 0', textAlign: 'center', letterSpacing: '0.15em' }}>
                NO ACTIVE GOALS —{' '}
                <Link href="/goals/create" style={{ color: 'var(--gold)', textDecoration: 'none' }}>CREATE ONE</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {goals.map(goal => {
                  const pct     = goal.progress_pct ?? 0
                  const overdue = new Date(goal.deadline) < new Date()
                  const fillCls = pct >= 100 ? 'progress-fill progress-fill-success' : overdue ? 'progress-fill progress-fill-danger' : 'progress-fill'
                  return (
                    <div key={goal.id}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{
                          fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13,
                          fontWeight: 500, color: 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          flex: 1, marginRight: 12,
                        }}>{goal.title}</div>
                        <span style={{
                          fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                          fontSize: 14, color: overdue ? 'var(--danger)' : 'var(--gold)',
                        }}>{pct}%</span>
                      </div>
                      <div className="progress-track">
                        <div className={fillCls} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="font-mono" style={{
                        fontSize: 8, marginTop: 4,
                        color: overdue ? 'var(--danger)' : 'var(--text-muted)',
                        letterSpacing: '0.1em',
                      }}>
                        {overdue ? '[!] OVERDUE' : `DUE ${new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </PanelCard>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Rank Status */}
          <PanelCard title="RANK STATUS">
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div className="hexagon" style={{
                width: 52, height: 52, background: 'var(--gold-dim)',
                border: '2px solid var(--gold-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <span style={{
                  fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                  fontSize: 14, color: 'var(--gold)',
                }}>
                  {stats.pos ? `#${stats.pos}` : '—'}
                </span>
              </div>
              <div style={{
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                fontSize: 16, textTransform: 'uppercase', color: 'var(--text-primary)',
                letterSpacing: '0.08em', marginBottom: 4,
              }}>{rankLabel}</div>
              {snaps[0]?.score != null && (
                <>
                  <div style={{
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                    fontSize: 22, color: 'var(--gold)',
                  }}>{snaps[0].score.toFixed(1)}</div>
                  <div className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                    MISSION SCORE
                  </div>
                </>
              )}
              <div style={{ marginTop: 12 }}>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${stats.rate}%` }} />
                </div>
                <div className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.1em' }}>
                  {stats.rate}% VERIFICATION RATE
                </div>
              </div>
            </div>
          </PanelCard>

          {/* Quick Deploy */}
          <PanelCard title="QUICK DEPLOY">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: '+ SUBMIT ACTIVITY', href: '/activities/submit', gold: true },
                { label: '▲ NEW OBJECTIVE',   href: '/goals/create',     gold: false },
                { label: '★ LEADERBOARD',     href: '/leaderboard',      gold: false },
                { label: '◉ AI COACH',        href: '/ai-coach',         gold: false },
              ].map(a => (
                <Link key={a.href} href={a.href} style={{
                  display: 'block', padding: '9px 12px',
                  background: a.gold ? 'var(--gold)' : 'transparent',
                  border: a.gold ? 'none' : '1px solid var(--b2)',
                  color: a.gold ? '#03060A' : 'var(--text-muted)',
                  fontFamily: 'Rajdhani, sans-serif', fontWeight: a.gold ? 700 : 600,
                  fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
                  textDecoration: 'none', transition: 'all 0.12s',
                }}
                  onMouseEnter={e => {
                    if (!a.gold) {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--b3)'
                      ;(e.currentTarget as HTMLElement).style.color = 'var(--gold)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!a.gold) {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--b2)'
                      ;(e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
                    }
                  }}
                >{a.label}</Link>
              ))}
            </div>
          </PanelCard>

          {/* AI Coach Mini */}
          <div className="panel panel-bracket" style={{
            borderTop: '1px solid var(--cyan)', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'var(--cyan)',
            }} />
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="blink-dot" style={{
                width: 6, height: 6, background: 'var(--cyan)', borderRadius: '50%',
              }} />
              <div className="font-mono" style={{
                fontSize: 9, letterSpacing: '0.22em', color: 'var(--cyan)',
              }}>AI INTELLIGENCE</div>
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{
                fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12,
                color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12,
              }}>{tip}</div>
              <Link href="/ai-coach" style={{
                fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
                color: 'var(--cyan)', textDecoration: 'none', letterSpacing: '0.12em',
              }}>
                OPEN COACH CHANNEL &gt;&gt;&gt;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
