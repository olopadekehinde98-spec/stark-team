import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

const RANK_ORDER = [
  'associate', 'senior_associate', 'manager', 'senior_manager',
  'director', 'senior_director', 'executive', 'senior_executive',
]

function rankProgress(rank: string) {
  const idx  = RANK_ORDER.indexOf(rank)
  const next = RANK_ORDER[idx + 1]
  const pct  = idx < 0 ? 0 : Math.round(((idx + 1) / RANK_ORDER.length) * 100)
  return { pct, next, isMax: idx === RANK_ORDER.length - 1 }
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
}

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (days < 1)  return 'TODAY'
  if (days < 7)  return `${days}D AGO`
  if (days < 30) return `${Math.floor(days / 7)}W AGO`
  return `${Math.floor(days / 30)}MO AGO`
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function StatusPill({ status }: { status: string }) {
  const cls: Record<string, string> = {
    verified: 'pill pill-verified', pending: 'pill pill-pending',
    rejected: 'pill pill-rejected', unverified: 'pill pill-unverified',
  }
  return <span className={cls[status] ?? 'pill pill-unverified'}>{status}</span>
}

export default async function UserProfilePage({
  params: _params,
}: {
  params: Promise<{ username: string }>
}) {
  const params   = await _params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id,full_name,username,role,rank,bio,created_at,is_active,last_seen_at,branches(name)')
    .eq('username', params.username)
    .single()

  if (!profile || !profile.is_active) notFound()

  const isMe = profile.id === user.id

  const [activitiesRes, goalsRes, badgesRes, recentActsRes] = await Promise.all([
    supabase.from('activities').select('status').eq('user_id', profile.id),
    supabase.from('goals').select('status').eq('user_id', profile.id),
    supabase.from('recognitions').select('id,badge_type,title').eq('recipient_id', profile.id).eq('is_revoked', false).limit(10),
    supabase.from('activities').select('id,title,activity_type,status,submitted_at').eq('user_id', profile.id).order('submitted_at', { ascending: false }).limit(8),
  ])

  const acts       = activitiesRes.data ?? []
  const goals      = goalsRes.data ?? []
  const badges     = badgesRes.data ?? []
  const recentActs = recentActsRes.data ?? []

  const verified     = acts.filter(a => a.status === 'verified').length
  const pending      = acts.filter(a => a.status === 'pending').length
  const completed    = goals.filter(g => g.status === 'completed').length
  const verifiedRate = acts.length > 0 ? Math.round((verified / acts.length) * 100) : 0

  const { pct: rankPct, next: nextRank, isMax } = rankProgress(profile.rank)
  const ini = initials(profile.full_name)

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>

      {/* ── HEADER ───────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
          fontSize: 22, textTransform: 'uppercase', letterSpacing: '0.10em',
          color: 'var(--text-primary)',
        }}>{isMe ? 'MY DOSSIER' : 'OPERATIVE DOSSIER'}</h1>
        <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', marginTop: 2 }}>
          {isMe ? 'YOUR PERSONAL RECORD' : `RECORD FOR @${profile.username.toUpperCase()}`}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>

        {/* ── LEFT: PROFILE CARD ─────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          <div className="panel panel-bracket" style={{ padding: '24px 20px', textAlign: 'center', position: 'relative' }}>
            {/* Avatar hex */}
            <div className="hexagon" style={{
              width: 60, height: 60, background: 'var(--gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <span style={{
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                fontSize: 20, color: '#03060A',
              }}>{ini}</span>
            </div>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.10em',
              color: 'var(--text-primary)', marginBottom: 2,
            }}>{profile.full_name}</div>
            <div className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 8 }}>
              @{profile.username}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className="pill pill-active" style={{ fontSize: 8 }}>
                {profile.rank?.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className="font-mono" style={{
                fontSize: 8, padding: '2px 7px',
                background: 'var(--s2)', border: '1px solid var(--b2)',
                color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>{profile.role}</span>
            </div>

            {/* Branch */}
            {(profile.branches as any)?.name && (
              <div className="font-mono" style={{
                marginTop: 10, fontSize: 8, color: 'var(--text-muted)',
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                ◎ {(profile.branches as any).name}
              </div>
            )}

            {profile.bio && (
              <div style={{
                marginTop: 12, padding: '10px 0',
                borderTop: '1px solid var(--b1)', borderBottom: '1px solid var(--b1)',
                fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12,
                color: 'var(--text-secondary)', lineHeight: 1.6, textAlign: 'left',
              }}>{profile.bio}</div>
            )}

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 12 }}>
              {[
                { label: 'TOTAL', value: acts.length, color: 'var(--gold)' },
                { label: 'VERIFIED', value: verified, color: 'var(--success)' },
                { label: 'GOALS', value: completed, color: 'var(--cyan)' },
                { label: 'RATE', value: `${verifiedRate}%`, color: 'var(--warning)' },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '8px 6px', background: 'var(--s2)',
                  border: '1px solid var(--b1)', textAlign: 'center',
                }}>
                  <div style={{
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                    fontSize: 18, color: s.color, lineHeight: 1,
                  }}>{s.value}</div>
                  <div className="font-mono" style={{ fontSize: 7, color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.12em' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Meta */}
            <div style={{ marginTop: 12 }}>
              <div className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.10em', marginBottom: 2 }}>
                ENLISTED: {fmt(profile.created_at)}
              </div>
              {profile.last_seen_at && (
                <div className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.10em' }}>
                  LAST ACTIVE: {timeAgo(profile.last_seen_at)}
                </div>
              )}
            </div>
          </div>

          {/* Commendation badges */}
          {badges.length > 0 && (
            <div className="panel" style={{ padding: '12px 14px' }}>
              <div className="font-mono" style={{ fontSize: 8, letterSpacing: '0.22em', color: 'var(--text-muted)', marginBottom: 10 }}>
                COMMENDATIONS ({badges.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {badges.map(b => (
                  <span key={b.id} style={{
                    padding: '3px 8px',
                    background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
                    fontFamily: 'Share Tech Mono, monospace', fontSize: 8,
                    color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    ✦ {b.badge_type}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: RANK PROGRESSION + ACTIVITY LOG ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Rank progression */}
          <div className="panel panel-bracket" style={{ padding: '20px 20px', position: 'relative' }}>
            <div className="font-mono" style={{
              fontSize: 9, letterSpacing: '0.22em', color: 'var(--text-muted)', marginBottom: 14,
            }}>RANK PROGRESSION</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div className="hexagon" style={{
                width: 44, height: 44, background: 'var(--gold-dim)',
                border: '1px solid var(--gold-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--gold)' }}>
                  {rankPct}%
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="font-mono" style={{ fontSize: 9, color: 'var(--gold)', letterSpacing: '0.08em' }}>
                    {profile.rank?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  {!isMax && nextRank && (
                    <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                      NEXT: {nextRank.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  )}
                  {isMax && (
                    <span className="font-mono" style={{ fontSize: 9, color: 'var(--gold)', letterSpacing: '0.08em' }}>
                      MAX RANK ACHIEVED
                    </span>
                  )}
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${rankPct}%` }} />
                </div>
              </div>
            </div>

            {/* Missing criteria */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'VERIFIED ACTIVITIES', value: `${verified}` },
                { label: 'CONSISTENCY (30D)',   value: acts.length > 0 ? 'ACTIVE' : 'NONE' },
                { label: 'PENDING REVIEW',       value: `${pending}` },
                { label: 'GOALS COMPLETED',      value: `${completed}` },
              ].map(row => (
                <div key={row.label} style={{
                  padding: '8px 10px', background: 'var(--s2)', border: '1px solid var(--b1)',
                }}>
                  <div className="font-mono" style={{ fontSize: 7, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 2 }}>
                    {row.label}
                  </div>
                  <div style={{
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                    fontSize: 14, color: 'var(--gold)',
                  }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity log */}
          <div className="panel" style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{
              padding: '10px 16px', borderBottom: '1px solid var(--b1)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div className="font-mono" style={{ fontSize: 9, letterSpacing: '0.22em', color: 'var(--text-muted)' }}>
                ACTIVITY LOG
              </div>
              <span className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)' }}>
                {acts.length} TOTAL
              </span>
            </div>

            {recentActs.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
                  NO ACTIVITIES RECORDED
                </div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--s2)', borderBottom: '1px solid var(--b1)' }}>
                    {['ACTIVITY', 'TYPE', 'STATUS', 'SUBMITTED'].map(h => (
                      <th key={h} style={{
                        padding: '8px 14px', textAlign: 'left',
                        fontFamily: 'Share Tech Mono, monospace',
                        fontSize: 8, letterSpacing: '0.15em', color: 'var(--text-muted)', fontWeight: 400,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentActs.map((a, i) => (
                    <tr key={a.id}
                      style={{ borderBottom: i < recentActs.length - 1 ? '1px solid var(--b1)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--gold-dim)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{
                          fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13,
                          fontWeight: 500, color: 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          maxWidth: 200,
                        }}>{a.title}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {a.activity_type}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <StatusPill status={a.status} />
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                          {timeAgo(a.submitted_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
