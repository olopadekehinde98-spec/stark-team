import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (myProfile?.role !== 'admin') redirect('/dashboard')

  const [totalUsersRes, activeWeekRes, pendingRes, usersListRes, invitesRes] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('activities').select('user_id').gte('submitted_at', new Date(Date.now() - 7 * 864e5).toISOString()),
    supabase.from('activities').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('users').select('id,full_name,username,role,rank,is_active,created_at').order('created_at', { ascending: false }).limit(15),
    supabase.from('invite_tokens').select('id,email,token,created_at,used_at,expires_at').order('created_at', { ascending: false }).limit(10),
  ])

  const totalUsers  = totalUsersRes.count ?? 0
  const activeWeek  = new Set(activeWeekRes.data?.map((a: any) => a.user_id)).size
  const pendingCount = pendingRes.count ?? 0
  const usersList   = usersListRes.data ?? []
  const invites     = invitesRes.data ?? []

  type AlertType = 'warning' | 'danger' | 'info'
  const alerts: { type: AlertType; message: string }[] = []
  if (pendingCount > 10) alerts.push({ type: 'warning', message: `${pendingCount} ACTIVITIES PENDING — LEADERS REQUIRE ATTENTION` })
  if (activeWeek < 3)    alerts.push({ type: 'danger',  message: 'LOW TEAM ACTIVITY THIS WEEK — FEWER THAN 3 ACTIVE OPERATIVES' })
  alerts.push({ type: 'info', message: 'ALL SYSTEMS NOMINAL — PLATFORM OPERATIONAL' })

  const ALERT_META: Record<AlertType, { color: string; bg: string; border: string; dot: string }> = {
    warning: { color: 'var(--warning)', bg: 'rgba(232,160,32,0.06)', border: 'rgba(232,160,32,0.25)', dot: 'blink-dot' },
    danger:  { color: 'var(--danger)',  bg: 'rgba(232,48,64,0.06)',  border: 'rgba(232,48,64,0.25)',  dot: 'blink-red' },
    info:    { color: 'var(--cyan)',    bg: 'rgba(32,200,224,0.04)', border: 'rgba(32,200,224,0.18)', dot: '' },
  }

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: '0 auto' }}>

      {/* ── HEADER ───────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
          fontSize: 22, textTransform: 'uppercase', letterSpacing: '0.10em',
          color: 'var(--text-primary)',
        }}>COMMAND CONTROL</h1>
        <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', marginTop: 2 }}>
          CLEARANCE: ADMIN · PLATFORM OVERVIEW AND SYSTEM CONTROLS
        </div>
      </div>

      {/* ── 4 STAT BLOCKS ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'TOTAL OPERATIVES', value: totalUsers,    color: 'var(--gold)'    },
          { label: 'ACTIVE THIS WEEK', value: activeWeek,    color: 'var(--success)' },
          { label: 'PENDING REVIEWS',  value: pendingCount,  color: 'var(--cyan)'    },
          { label: 'SYSTEM ALERTS',    value: alerts.length, color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="panel" style={{ borderLeft: `2px solid ${s.color}`, padding: '14px 16px' }}>
            <div className="font-mono" style={{ fontSize: 8, letterSpacing: '0.18em', color: 'var(--text-muted)', marginBottom: 8 }}>
              {s.label}
            </div>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 28, color: s.color, lineHeight: 1,
            }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── TWO COLUMN ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>

        {/* ── OPERATIVE ROSTER TABLE ────────────── */}
        <div className="panel" style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', borderBottom: '1px solid var(--b1)',
          }}>
            <div className="font-mono" style={{ fontSize: 9, letterSpacing: '0.22em', color: 'var(--text-muted)' }}>
              OPERATIVE ROSTER
            </div>
            <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
              {totalUsers} TOTAL
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--s2)', borderBottom: '1px solid var(--b1)' }}>
                {['OPERATIVE', 'ROLE', 'RANK', 'JOINED', 'STATUS'].map(h => (
                  <th key={h} style={{
                    padding: '8px 14px', textAlign: 'left',
                    fontFamily: 'Share Tech Mono, monospace',
                    fontSize: 8, letterSpacing: '0.18em', color: 'var(--text-muted)', fontWeight: 400,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usersList.map((u, i) => (
                <tr key={u.id}
                  style={{ borderBottom: i < usersList.length - 1 ? '1px solid var(--b1)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--gold-dim)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="hexagon" style={{
                        width: 26, height: 26, background: 'var(--gold-dim)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 9, color: 'var(--gold)' }}>
                          {initials(u.full_name)}
                        </span>
                      </div>
                      <div>
                        <Link href={`/profile/${u.username}`} style={{
                          fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
                          fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em',
                          color: 'var(--text-primary)', textDecoration: 'none',
                        }}>{u.full_name}</Link>
                        <div className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)' }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className="font-mono" style={{
                      fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: u.role === 'admin' ? 'var(--gold)' : u.role === 'leader' ? 'var(--cyan)' : 'var(--text-muted)',
                    }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className="pill pill-active" style={{ fontSize: 7 }}>
                      {u.rank?.replace(/_/g, ' ').toUpperCase() ?? '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)' }}>
                      {fmt(u.created_at)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className="font-mono" style={{
                      fontSize: 8, padding: '2px 6px',
                      background: u.is_active ? 'rgba(61,220,132,0.10)' : 'rgba(232,48,64,0.10)',
                      border: u.is_active ? '1px solid rgba(61,220,132,0.25)' : '1px solid rgba(232,48,64,0.25)',
                      color: u.is_active ? 'var(--success)' : 'var(--danger)',
                      letterSpacing: '0.08em',
                    }}>
                      {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── RIGHT COLUMN ─────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* System alerts */}
          <div className="panel" style={{
            overflow: 'hidden',
            borderLeft: '2px solid var(--danger)',
          }}>
            <div style={{
              padding: '10px 14px', borderBottom: '1px solid var(--b1)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                width: 6, height: 6, background: 'var(--danger)', borderRadius: '50%',
                animation: 'blinkred 1.5s step-start infinite',
              }} />
              <div className="font-mono" style={{ fontSize: 9, letterSpacing: '0.22em', color: 'var(--danger)' }}>
                SYSTEM ALERTS
              </div>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.map((alert, i) => {
                const c = ALERT_META[alert.type]
                return (
                  <div key={i} style={{
                    padding: '10px 12px',
                    background: c.bg, border: `1px solid ${c.border}`,
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: c.color, marginTop: 3,
                      animation: alert.type !== 'info' ? 'blinkred 1.5s step-start infinite' : 'none',
                    }} />
                    <div style={{
                      fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12,
                      color: c.color, lineHeight: 1.5,
                    }}>{alert.message}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Invite links */}
          <div className="panel" style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderBottom: '1px solid var(--b1)',
            }}>
              <div className="font-mono" style={{ fontSize: 9, letterSpacing: '0.22em', color: 'var(--text-muted)' }}>
                INVITE TOKENS
              </div>
              <Link href="/admin/invites" style={{
                fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
                color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.08em',
              }}>+ NEW &gt;&gt;</Link>
            </div>
            <div style={{ padding: '12px 14px' }}>
              {invites.length === 0 ? (
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0', letterSpacing: '0.15em' }}>
                  NO INVITE TOKENS ISSUED
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {invites.map(inv => (
                    <div key={inv.id} style={{
                      padding: '8px 10px',
                      background: 'var(--s2)', border: '1px solid var(--b1)',
                    }}>
                      <div style={{
                        fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12,
                        color: 'var(--text-primary)', marginBottom: 2,
                      }}>{inv.email ?? 'OPEN INVITE'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)' }}>
                          {inv.token?.slice(0, 10)}…
                        </span>
                        <span className="font-mono" style={{
                          fontSize: 7, padding: '1px 5px',
                          background: inv.used_at ? 'rgba(61,96,112,0.15)' : 'rgba(61,220,132,0.10)',
                          border: inv.used_at ? '1px solid var(--b1)' : '1px solid rgba(61,220,132,0.25)',
                          color: inv.used_at ? 'var(--text-muted)' : 'var(--success)',
                          letterSpacing: '0.08em',
                        }}>
                          {inv.used_at ? 'USED' : 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
