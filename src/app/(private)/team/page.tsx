import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type Member = {
  id: string; full_name: string; username: string
  role: string; rank: string; is_active: boolean
  last_seen_at?: string; branch_id?: string
  branches?: { name: string } | null
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function activityStatus(lastSeen?: string): { color: string; label: string } {
  if (!lastSeen) return { color: 'var(--danger)',  label: 'DARK' }
  const d = (Date.now() - new Date(lastSeen).getTime()) / 86400000
  if (d < 7)  return { color: 'var(--success)', label: 'ACTIVE'   }
  if (d < 14) return { color: 'var(--warning)', label: '7D+'      }
  return             { color: 'var(--danger)',  label: '14D+'     }
}

function NodeCard({ m, isMe = false }: { m: Member; isMe?: boolean }) {
  const status = activityStatus(m.last_seen_at)
  return (
    <Link href={`/profile/${m.username}`} style={{ textDecoration: 'none' }}>
      <div style={{
        width: 120, padding: '12px 10px', textAlign: 'center',
        background: isMe ? 'var(--gold-dim)' : 'var(--s1)',
        border: `1px solid ${isMe ? 'var(--gold-border)' : 'var(--b2)'}`,
        position: 'relative',
        transition: 'border-color 0.15s',
      }}>
        {/* corner bracket on current user node */}
        {isMe && (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 8, height: 8, borderTop: '1px solid var(--gold)', borderLeft: '1px solid var(--gold)' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderTop: '1px solid var(--gold)', borderRight: '1px solid var(--gold)' }} />
          </>
        )}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
          <div className="hexagon" style={{
            width: 36, height: 36,
            background: isMe ? 'var(--gold)' : 'var(--s2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 11, color: isMe ? '#03060A' : 'var(--gold)',
            }}>{initials(m.full_name)}</span>
          </div>
          {/* Status square — not circle */}
          <span style={{
            position: 'absolute', bottom: 0, right: -2,
            width: 7, height: 7,
            background: status.color,
            border: '1px solid var(--s1)',
          }} />
        </div>
        <div style={{
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
          fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
          color: isMe ? 'var(--gold)' : 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 2,
        }}>{m.full_name.split(' ')[0]}</div>
        <div className="font-mono" style={{
          fontSize: 7, color: isMe ? 'var(--gold)' : 'var(--text-muted)',
          letterSpacing: '0.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{m.rank.replace(/_/g, ' ').toUpperCase()}</div>
      </div>
    </Link>
  )
}

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase
    .from('users').select('id,full_name,rank,role,branch_id,username,last_seen_at').eq('id', user.id).single()

  const { data: members } = await supabase
    .from('users')
    .select('id,full_name,username,role,rank,is_active,last_seen_at,branch_id,branches(name)')
    .eq('is_active', true)
    .order('rank')

  const branchId      = myProfile?.branch_id
  const branchMembers = (members ?? []).filter(m => m.id !== user.id && m.branch_id === branchId)
  const others        = (members ?? []).filter(m => m.id !== user.id && m.branch_id !== branchId)

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>

      {/* ── HEADER ───────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
          fontSize: 22, textTransform: 'uppercase', letterSpacing: '0.10em',
          color: 'var(--text-primary)',
        }}>TEAM STRUCTURE</h1>
        <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', marginTop: 2 }}>
          BRANCH CLEARANCE · {members?.length ?? 0} ACTIVE OPERATIVES
        </div>
      </div>

      {/* ── TREE PANEL ───────────────────────────── */}
      <div className="panel" style={{ padding: '32px 24px', marginBottom: 16 }}>

        {/* Current user */}
        {myProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <NodeCard m={myProfile as unknown as Member} isMe />

            {branchMembers.length > 0 && (
              <>
                <div style={{ width: 1, height: 24, background: 'var(--b2)', marginTop: 0 }} />
                {/* Horizontal connector */}
                <div style={{
                  width: Math.min(branchMembers.length, 6) * 140,
                  height: 1, background: 'var(--b2)',
                  maxWidth: '90%',
                }} />
                {/* Branch nodes */}
                <div style={{ display: 'flex', gap: 16, marginTop: 0, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {branchMembers.map(m => (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 1, height: 20, background: 'var(--b2)' }} />
                      <NodeCard m={m as unknown as Member} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {branchMembers.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
              NO BRANCH MEMBERS ASSIGNED
            </div>
          </div>
        )}
      </div>

      {/* ── STATUS LEGEND ────────────────────────── */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { color: 'var(--success)', label: 'ACTIVE (< 7 DAYS)'    },
          { color: 'var(--warning)', label: 'INACTIVE 7–14 DAYS'   },
          { color: 'var(--danger)',  label: 'DARK 14+ DAYS'         },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, background: l.color, flexShrink: 0 }} />
            <span className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
              {l.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── OTHER BRANCHES TABLE ──────────────────── */}
      {others.length > 0 && (
        <>
          <div className="font-mono" style={{
            fontSize: 8, letterSpacing: '0.25em', color: 'var(--text-muted)',
            marginBottom: 10,
          }}>OTHER BRANCHES</div>
          <div className="panel" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--s2)', borderBottom: '1px solid var(--b1)' }}>
                  {['OPERATIVE', 'RANK', 'ROLE', 'BRANCH', 'STATUS'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontFamily: 'Share Tech Mono, monospace',
                      fontSize: 9, letterSpacing: '0.15em', color: 'var(--text-muted)', fontWeight: 400,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {others.map((m, i) => {
                  const status = activityStatus((m as unknown as Member).last_seen_at)
                  return (
                    <tr key={m.id} style={{ borderBottom: i < others.length - 1 ? '1px solid var(--b1)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--gold-dim)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="hexagon" style={{
                            width: 28, height: 28, background: 'var(--s2)', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 9, color: 'var(--gold)' }}>
                              {initials(m.full_name)}
                            </span>
                          </div>
                          <div>
                            <Link href={`/profile/${m.username}`} style={{
                              fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
                              fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em',
                              color: 'var(--text-primary)', textDecoration: 'none',
                            }}>{m.full_name}</Link>
                            <div className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)' }}>@{m.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="pill pill-active" style={{ fontSize: 7 }}>
                          {m.rank.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                          {m.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                          {((m as any).branches as any)?.name ?? '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, background: status.color, flexShrink: 0 }} />
                          <span className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                            {status.label}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
