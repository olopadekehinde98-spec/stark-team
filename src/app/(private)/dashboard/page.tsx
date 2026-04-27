'use client'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

/* ── helpers ── */
function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 1)    return 'just now'
  if (mins < 60)   return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

const STATUS_COLOR: Record<string, string> = {
  verified: '#10b981', pending: '#f59e0b', rejected: '#ef4444',
}

/* ── Stat Card ── */
function StatCard({ label, value, sub, icon, gradient, glow }: {
  label: string; value: string | number; sub?: string
  icon: string; gradient: string; glow: string
}) {
  return (
    <div style={{
      background: '#111827',
      border: '1px solid #1f2937',
      borderRadius: 16, padding: '22px 22px',
      position: 'relative', overflow: 'hidden',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${glow}`
        ;(e.currentTarget as HTMLElement).style.borderColor = glow
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
        ;(e.currentTarget as HTMLElement).style.borderColor = '#1f2937'
      }}
    >
      {/* bg glow blob */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: gradient, opacity: 0.15, filter: 'blur(24px)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.10em' }}>
          {label}
        </span>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: gradient, opacity: 0.18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>{icon}</div>
      </div>

      <div style={{
        fontSize: 36, fontWeight: 900, lineHeight: 1,
        background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        marginBottom: 8,
      }}>{value}</div>

      {sub && <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, actsRes, goalsRes, leaderRes, recentRes, pinnedRes] = await Promise.all([
        supabase.from('users').select('full_name,rank,branch_id').eq('id', user.id).single(),
        supabase.from('activities').select('status').eq('user_id', user.id),
        supabase.from('goals').select('title,status,target_value,current_value,deadline').eq('user_id', user.id).limit(3),
        supabase.from('leaderboard_entries').select('rank,score,users(full_name,rank)').order('rank').limit(5),
        supabase.from('activities').select('title,activity_type,status,submitted_at').eq('user_id', user.id)
          .order('submitted_at', { ascending: false }).limit(5),
        fetch('/api/announcements').then(r => r.json()).catch(() => []),
      ])

      const acts     = actsRes.data ?? []
      const verified = acts.filter(a => a.status === 'verified').length
      const pending  = acts.filter(a => a.status === 'pending').length
      const rate     = acts.length > 0 ? Math.round((verified / acts.length) * 100) : 0

      setData({
        profile:  profileRes.data,
        total:    acts.length,
        verified, pending, rate,
        goals:    goalsRes.data  ?? [],
        leaders:  leaderRes.data ?? [],
        recent:   recentRes.data ?? [],
        pinned:   Array.isArray(pinnedRes) ? pinnedRes : [],
      })
      setLoading(false)
    })()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
          border: '3px solid rgba(99,102,241,0.15)',
          borderTop: '3px solid #6366f1',
          animation: 'spin 0.8s linear infinite',
        }} />
        <div style={{ fontSize: 12, color: '#4b5563', letterSpacing: '0.10em' }}>LOADING DASHBOARD…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!data) return null

  const name      = data.profile?.full_name?.split(' ')[0] ?? 'Operative'
  const rankLabel = (data.profile?.rank ?? 'member').replace(/_/g, ' ')
  const month     = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 1400, margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── HERO HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 50%, transparent 100%)',
        border: '1px solid rgba(99,102,241,0.18)',
        borderRadius: 18, padding: '28px 32px', marginBottom: 28,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* background decoration */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -30, right: 100,
          width: 140, height: 140, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
              Command Dashboard — {month}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', margin: 0, lineHeight: 1.2 }}>
              Welcome back, <span style={{
                background: 'linear-gradient(135deg, #818cf8, #c084fc)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{name}</span>
            </h1>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
              Rank: <span style={{ color: '#a78bfa', fontWeight: 600, textTransform: 'capitalize' }}>{rankLabel}</span>
              {'  ·  '}{data.rate}% verification rate this month
            </div>
          </div>
          <Link href="/activities/submit" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 20px', borderRadius: 10, textDecoration: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontSize: 13, fontWeight: 700,
            boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
            transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
          >
            <span style={{ fontSize: 16 }}>⚡</span> Submit Activity
          </Link>
        </div>
      </div>

      {/* ── PINNED ANNOUNCEMENTS ── */}
      {data.pinned.length > 0 && (
        <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.pinned.map((a: any) => (
            <div key={a.id} style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.07), rgba(99,102,241,0.05))',
              border: '1px solid rgba(245,158,11,0.22)',
              borderRadius: 12, padding: '14px 20px',
              display: 'flex', alignItems: 'flex-start', gap: 14,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>📌</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 3 }}>{a.title}</div>
                <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.55 }}>{a.body}</div>
                <div style={{ fontSize: 11, color: '#4b5563', marginTop: 6 }}>
                  {a.author?.full_name ?? 'Admin'} · {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Total Activities" value={data.total}
          sub={`+${data.total} this month`}
          icon="⚡"
          gradient="linear-gradient(135deg, #6366f1, #8b5cf6)"
          glow="rgba(99,102,241,0.25)"
        />
        <StatCard
          label="Verified" value={data.verified}
          sub={`${data.rate}% approval rate`}
          icon="✓"
          gradient="linear-gradient(135deg, #10b981, #059669)"
          glow="rgba(16,185,129,0.25)"
        />
        <StatCard
          label="Pending Review" value={data.pending}
          sub={data.pending > 0 ? 'Awaiting verification' : 'All clear'}
          icon="◔"
          gradient="linear-gradient(135deg, #f59e0b, #d97706)"
          glow="rgba(245,158,11,0.25)"
        />
        <StatCard
          label="Rank Progress" value={`${data.rate}%`}
          sub={`Current: ${rankLabel}`}
          icon="▲"
          gradient="linear-gradient(135deg, #ec4899, #8b5cf6)"
          glow="rgba(236,72,153,0.20)"
        />
      </div>

      {/* ── ROW 2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginBottom: 28 }}>

        {/* Leaderboard */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 16, padding: '22px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
              Monthly Leaderboard
            </div>
            <Link href="/leaderboard" style={{
              fontSize: 12, color: '#6366f1', fontWeight: 600, textDecoration: 'none',
              padding: '4px 12px', borderRadius: 20,
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.20)',
              transition: 'background 0.15s',
            }}>View all →</Link>
          </div>

          {data.leaders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#374151' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
              <div style={{ fontSize: 13 }}>No entries yet this month</div>
            </div>
          ) : data.leaders.map((l: any, i: number) => {
            const medals = ['🥇', '🥈', '🥉']
            const name   = (l.users as any)?.full_name ?? 'Unknown'
            const init   = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
            const gradients = [
              'linear-gradient(135deg,#f59e0b,#d97706)',
              'linear-gradient(135deg,#9ca3af,#6b7280)',
              'linear-gradient(135deg,#b45309,#92400e)',
              'linear-gradient(135deg,#6366f1,#8b5cf6)',
              'linear-gradient(135deg,#10b981,#059669)',
            ]
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px', borderRadius: 10, marginBottom: 4,
                background: i === 0 ? 'rgba(245,158,11,0.06)' : 'transparent',
                border: i === 0 ? '1px solid rgba(245,158,11,0.14)' : '1px solid transparent',
              }}>
                <div style={{ fontSize: 20, width: 28, textAlign: 'center' }}>
                  {medals[i] ?? `${i + 1}`}
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: gradients[i] ?? gradients[3],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: '#fff',
                }}>{init}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{name}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>
                    {(l.users as any)?.rank?.replace(/_/g, ' ') ?? '—'}
                  </div>
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 800,
                  background: 'linear-gradient(135deg,#818cf8,#c084fc)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{l.score}<span style={{ fontSize: 10, WebkitTextFillColor: '#6b7280' }}>pts</span></div>
              </div>
            )
          })}
        </div>

        {/* Activity Feed */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 16, padding: '22px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Activity Feed</div>
            <Link href="/activities" style={{
              fontSize: 12, color: '#6366f1', fontWeight: 600, textDecoration: 'none',
              padding: '4px 12px', borderRadius: 20,
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.20)',
            }}>See all →</Link>
          </div>

          {data.recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#374151' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
              <div style={{ fontSize: 13 }}>No activities yet</div>
            </div>
          ) : data.recent.map((a: any, i: number) => (
            <div key={a.id ?? i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '11px 0',
              borderBottom: i < data.recent.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                background: STATUS_COLOR[a.status] ?? '#8b5cf6',
                boxShadow: `0 0 6px ${STATUS_COLOR[a.status] ?? '#8b5cf6'}`,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: '#e2e8f0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{a.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{a.activity_type}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                    background: a.status === 'verified' ? 'rgba(16,185,129,0.12)'
                               : a.status === 'pending' ? 'rgba(245,158,11,0.12)'
                               : 'rgba(239,68,68,0.12)',
                    color: STATUS_COLOR[a.status] ?? '#9ca3af',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{a.status}</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#374151', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {timeAgo(a.submitted_at)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROW 3 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* Goals */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 16, padding: '22px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>My Goals</div>
            <Link href="/goals/create" style={{
              fontSize: 12, color: '#6366f1', fontWeight: 600, textDecoration: 'none',
              padding: '4px 12px', borderRadius: 20,
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.20)',
            }}>+ New →</Link>
          </div>
          {data.goals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#374151' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>◎</div>
              <div style={{ fontSize: 13 }}>No goals set yet</div>
            </div>
          ) : data.goals.map((g: any, i: number) => {
            const pct = g.target_value > 0 ? Math.min(100, Math.round((g.current_value / g.target_value) * 100)) : 0
            return (
              <div key={i} style={{ marginBottom: i < data.goals.length - 1 ? 18 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{g.title}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa' }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: '#1f2937', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 999,
                    width: `${pct}%`,
                    background: pct >= 100
                      ? 'linear-gradient(90deg, #10b981, #059669)'
                      : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    transition: 'width 0.5s ease',
                    boxShadow: pct >= 100 ? '0 0 8px rgba(16,185,129,0.4)' : '0 0 8px rgba(99,102,241,0.4)',
                  }} />
                </div>
                <div style={{ fontSize: 11, color: '#4b5563', marginTop: 5 }}>
                  {g.current_value} / {g.target_value}
                  {g.deadline ? ` · Due ${new Date(g.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                  {pct >= 100 ? ' · ✓ Done' : ''}
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 16, padding: '22px 22px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>Quick Actions</div>
          {[
            { label: 'Submit Activity',   href: '/activities/submit', icon: '⚡', g: 'linear-gradient(135deg,#6366f1,#8b5cf6)', glow: 'rgba(99,102,241,0.3)' },
            { label: 'Verify Queue',      href: '/verify',            icon: '✓',  g: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.3)'  },
            { label: 'Open AI Coach',     href: '/ai-coach',          icon: '◆',  g: 'linear-gradient(135deg,#8b5cf6,#ec4899)', glow: 'rgba(139,92,246,0.3)'  },
            { label: 'View Leaderboard',  href: '/leaderboard',       icon: '▲',  g: 'linear-gradient(135deg,#f59e0b,#ef4444)', glow: 'rgba(245,158,11,0.3)'  },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '11px 14px', borderRadius: 10, marginBottom: 8,
              background: '#1a2030', border: '1px solid #1f2937',
              textDecoration: 'none', transition: 'all 0.15s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#1f2937'
                ;(e.currentTarget as HTMLElement).style.borderColor = item.glow.replace('0.3', '0.5')
                ;(e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${item.glow}`
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = '#1a2030'
                ;(e.currentTarget as HTMLElement).style.borderColor = '#1f2937'
                ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: item.g,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: '#fff',
                boxShadow: `0 4px 12px ${item.glow}`,
              }}>{item.icon}</div>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#e2e8f0', flex: 1 }}>{item.label}</span>
              <span style={{ color: '#374151', fontSize: 16 }}>›</span>
            </Link>
          ))}
        </div>

        {/* Rank Status */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 16, padding: '22px 22px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>Rank Status</div>

          {/* Rank badge */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', margin: '0 auto 12px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.20), rgba(139,92,246,0.15))',
              border: '2px solid rgba(99,102,241,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(99,102,241,0.20)',
            }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#a78bfa' }}>
                {rankLabel.split(' ').map(w => w[0]).join('').toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', textTransform: 'capitalize', marginBottom: 3 }}>
              {rankLabel}
            </div>
            <div style={{ fontSize: 11, color: '#4b5563' }}>Current Rank</div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 11, color: '#6b7280' }}>Verification Progress</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa' }}>{data.rate}%</span>
            </div>
            <div style={{ height: 8, background: '#1f2937', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 999,
                width: `${data.rate}%`,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                boxShadow: '0 0 10px rgba(99,102,241,0.5)',
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>

          {/* Mini stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Verified',  value: data.verified, color: '#10b981' },
              { label: 'Pending',   value: data.pending,  color: '#f59e0b' },
              { label: 'Total',     value: data.total,    color: '#818cf8' },
              { label: 'Rate',      value: `${data.rate}%`, color: '#c084fc' },
            ].map(s => (
              <div key={s.label} style={{
                background: '#1a2030', border: '1px solid #1f2937',
                borderRadius: 10, padding: '10px 12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 9, color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
