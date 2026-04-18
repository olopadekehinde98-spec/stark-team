'use client'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

function StatCard({ label, value, delta, deltaUp, icon, valueColor }: {
  label: string; value: string | number; delta?: string; deltaUp?: boolean; icon: string; valueColor?: string
}) {
  return (
    <div style={{
      background: '#111827', border: '1px solid #1f2937',
      borderRadius: 14, padding: '20px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </div>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={{
        fontSize: 30, fontWeight: 800, marginBottom: 4,
        ...(valueColor ? { color: valueColor } : {
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        })
      }}>{value}</div>
      {delta && (
        <div style={{ fontSize: 12, color: deltaUp ? '#10b981' : '#ef4444' }}>
          {deltaUp ? '↑' : '↓'} {delta}
        </div>
      )}
    </div>
  )
}

function ActivityDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    verified: '#10b981', pending: '#f59e0b', rejected: '#ef4444', default: '#8b5cf6'
  }
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
      background: colors[status] ?? colors.default,
    }} />
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, actsRes, goalsRes, leaderRes, recentRes] = await Promise.all([
        supabase.from('users').select('full_name,rank,branch_id').eq('id', user.id).single(),
        supabase.from('activities').select('status').eq('user_id', user.id),
        supabase.from('goals').select('title,status,target_value,current_value,deadline').eq('user_id', user.id).limit(3),
        supabase.from('leaderboard_entries').select('rank,score,users(full_name,rank)').order('rank').limit(5),
        supabase.from('activities').select('title,activity_type,status,submitted_at').eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(4),
      ])

      const acts = actsRes.data ?? []
      const verified = acts.filter(a => a.status === 'verified').length
      const pending  = acts.filter(a => a.status === 'pending').length
      const rate     = acts.length > 0 ? Math.round((verified / acts.length) * 100) : 0

      setData({
        profile: profileRes.data,
        total: acts.length,
        verified,
        pending,
        rate,
        goals: goalsRes.data ?? [],
        leaders: leaderRes.data ?? [],
        recent: recentRes.data ?? [],
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <div style={{ color: '#6b7280', fontSize: 13 }}>Loading...</div>
    </div>
  )
  if (!data) return null

  const now = new Date()
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: '0 auto' }}>

      {/* Page label */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#4b5563', textTransform: 'uppercase', marginBottom: 20 }}>
        Overview — {monthLabel}
      </div>

      {/* ── STATS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Activities" value={data.total} delta="this month" deltaUp icon="⚡" />
        <StatCard label="Verified" value={data.verified} delta={`${data.rate}% rate`} deltaUp icon="✓" valueColor="#10b981" />
        <StatCard label="Pending Review" value={data.pending} delta={data.pending > 0 ? 'needs action' : 'all clear'} deltaUp={data.pending === 0} icon="◔" valueColor="#f59e0b" />
        <StatCard label="Active Members" value="—" delta="in your branch" deltaUp icon="◈" valueColor="#f1f5f9" />
      </div>

      {/* ── ROW 2: Leaderboard + Activity Feed ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, marginBottom: 24 }}>

        {/* Leaderboard */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Monthly Leaderboard</div>
            <Link href="/leaderboard" style={{ fontSize: 12, color: '#6366f1', fontWeight: 500, textDecoration: 'none' }}>View all →</Link>
          </div>
          {data.leaders.length === 0 ? (
            <div style={{ fontSize: 13, color: '#4b5563', textAlign: 'center', padding: '20px 0' }}>No entries yet</div>
          ) : data.leaders.map((l: any, i: number) => {
            const rankColors: Record<number, string> = { 0: '#f59e0b', 1: '#9ca3af', 2: '#b45309' }
            const avatarColors = [
              'linear-gradient(135deg,#6366f1,#8b5cf6)',
              'linear-gradient(135deg,#10b981,#059669)',
              'linear-gradient(135deg,#f59e0b,#d97706)',
              'linear-gradient(135deg,#ec4899,#db2777)',
              'linear-gradient(135deg,#14b8a6,#0d9488)',
            ]
            const name = (l.users as any)?.full_name ?? 'Unknown'
            const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: i < data.leaders.length - 1 ? '1px solid #1f2937' : 'none',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: rankColors[i] ?? '#4b5563', width: 20, textAlign: 'center' }}>
                  {l.rank ?? i + 1}
                </div>
                <div className="avatar" style={{ width: 28, height: 28, fontSize: 10, background: avatarColors[i] ?? avatarColors[0] }}>{initials}</div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{name}</div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                  background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.18)',
                }}>
                  {(l.users as any)?.rank?.replace(/_/g, ' ') ?? '—'}
                </span>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>{l.score} pts</div>
              </div>
            )
          })}
        </div>

        {/* Activity Feed */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Activity Feed</div>
            <Link href="/activities" style={{ fontSize: 12, color: '#6366f1', fontWeight: 500, textDecoration: 'none' }}>See all →</Link>
          </div>
          {data.recent.length === 0 ? (
            <div style={{ fontSize: 13, color: '#4b5563', textAlign: 'center', padding: '20px 0' }}>No activities yet</div>
          ) : data.recent.map((a: any, i: number) => {
            const timeAgo = (d: string) => {
              const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
              if (mins < 60) return `${mins}m ago`
              if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
              return `${Math.floor(mins / 1440)}d ago`
            }
            return (
              <div key={a.id ?? i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 0', borderBottom: i < data.recent.length - 1 ? '1px solid #1f2937' : 'none',
              }}>
                <ActivityDot status={a.status} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                    {a.activity_type} · <span className={`pill pill-${a.status}`}>{a.status}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#4b5563', whiteSpace: 'nowrap' }}>{timeAgo(a.submitted_at)}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── ROW 3: Goals + Quick Links ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* Goals */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>My Goals</div>
            <Link href="/goals/create" style={{ fontSize: 12, color: '#6366f1', fontWeight: 500, textDecoration: 'none' }}>+ Add →</Link>
          </div>
          {data.goals.length === 0 ? (
            <div style={{ fontSize: 13, color: '#4b5563', textAlign: 'center', padding: '20px 0' }}>No goals set</div>
          ) : data.goals.map((g: any, i: number) => {
            const pct = g.target_value > 0 ? Math.min(100, Math.round((g.current_value / g.target_value) * 100)) : 0
            const fillStyle = pct >= 100 ? 'progress-fill-success' : 'progress-fill'
            return (
              <div key={g.title ?? i} style={{ marginBottom: i < data.goals.length - 1 ? 16 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{g.title}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>{pct}%</span>
                </div>
                <div className="progress-track">
                  <div className={fillStyle} style={{ width: `${pct}%` }} />
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                  {g.current_value} / {g.target_value}
                  {g.deadline ? ` · Due ${new Date(g.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                  {pct >= 100 ? ' · ✓ Completed' : ''}
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Quick Actions</div>
          {[
            { label: 'Submit Activity', href: '/activities/submit', icon: '⚡', color: '#6366f1' },
            { label: 'View Verify Queue', href: '/verify', icon: '✓', color: '#10b981' },
            { label: 'Open AI Coach', href: '/ai-coach', icon: '◆', color: '#8b5cf6' },
            { label: 'View Leaderboard', href: '/leaderboard', icon: '▲', color: '#f59e0b' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 8, marginBottom: 6,
              background: '#1f2937', textDecoration: 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#374151'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#1f2937'}
            >
              <span style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: `${item.color}18`, border: `1px solid ${item.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: item.color,
              }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{item.label}</span>
              <span style={{ marginLeft: 'auto', color: '#4b5563', fontSize: 14 }}>→</span>
            </Link>
          ))}
        </div>

        {/* Rank Status */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Rank Status</div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 10px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
              border: '2px solid rgba(99,102,241,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#a78bfa' }}>
                {data.profile?.rank?.replace(/_/g, ' ').split(' ').map((w: string) => w[0]).join('').toUpperCase() ?? '?'}
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', textTransform: 'capitalize' }}>
              {data.profile?.rank?.replace(/_/g, ' ') ?? 'Unknown'}
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#6b7280' }}>Progress</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa' }}>{data.rate}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${data.rate}%` }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            {[
              { label: 'Verified', value: data.verified },
              { label: 'Pending', value: data.pending },
              { label: 'Total', value: data.total },
              { label: 'Rate', value: `${data.rate}%` },
            ].map(s => (
              <div key={s.label} style={{
                background: '#1f2937', borderRadius: 8, padding: '8px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#a78bfa' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
