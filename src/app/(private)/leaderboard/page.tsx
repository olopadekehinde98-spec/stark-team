import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type Period = 'daily' | 'weekly' | 'monthly' | 'all_time'
const PERIOD_LABELS: Record<Period, string> = {
  daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY', all_time: 'ALL-TIME',
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function PositionNum({ pos }: { pos: number }) {
  const color = pos === 1 ? 'var(--gold)' : pos === 2 ? '#8AABB8' : pos === 3 ? 'var(--warning)' : 'var(--text-muted)'
  return (
    <span style={{
      fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
      fontSize: pos <= 3 ? 20 : 15,
      color,
    }}>
      #{pos}
    </span>
  )
}

export default async function LeaderboardPage({
  searchParams: _sp,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const sp     = await _sp
  const period = ((sp?.period) ?? 'monthly') as Period
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  let { data: snapshots } = await supabase
    .from('leaderboard_snapshots')
    .select('user_id,score,rank_position,snapshot_date')
    .eq('period', period)
    .eq('snapshot_date', today)
    .order('rank_position', { ascending: true })
    .limit(50)

  if (!snapshots?.length) {
    const { data: latest } = await supabase
      .from('leaderboard_snapshots')
      .select('snapshot_date')
      .eq('period', period)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single()
    if (latest) {
      const res = await supabase
        .from('leaderboard_snapshots')
        .select('user_id,score,rank_position,snapshot_date')
        .eq('period', period)
        .eq('snapshot_date', latest.snapshot_date)
        .order('rank_position', { ascending: true })
        .limit(50)
      snapshots = res.data
    }
  }

  const userIds = snapshots?.map(s => s.user_id) ?? []
  const { data: users } = userIds.length
    ? await supabase.from('users').select('id,full_name,username,rank').in('id', userIds)
    : { data: [] }

  const usersMap     = Object.fromEntries((users ?? []).map(u => [u.id, u]))
  const mySnap       = snapshots?.find(s => s.user_id === user.id)
  const snapshotDate = snapshots?.[0]?.snapshot_date
  const PERIODS: Period[] = ['daily', 'weekly', 'monthly', 'all_time']

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>

      {/* ── HEADER ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            fontSize: 22, textTransform: 'uppercase', letterSpacing: '0.10em',
            color: 'var(--text-primary)',
          }}>LEADERBOARD</h1>
          <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', marginTop: 2 }}>
            {snapshotDate
              ? `${PERIOD_LABELS[period]} RANKINGS · ${new Date(snapshotDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase()}`
              : `${PERIOD_LABELS[period]} RANKINGS · NO DATA YET`}
          </div>
        </div>
        {mySnap && (
          <div style={{
            padding: '10px 16px', textAlign: 'center',
            background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
          }}>
            <div className="font-mono" style={{ fontSize: 8, letterSpacing: '0.18em', color: 'var(--gold)', marginBottom: 2 }}>
              YOUR RANK
            </div>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 22, color: 'var(--gold)', lineHeight: 1,
            }}>#{mySnap.rank_position}</div>
          </div>
        )}
      </div>

      {/* ── PERIOD TABS ──────────────────────────── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20 }}>
        {PERIODS.map(p => (
          <Link key={p} href={`/leaderboard?period=${p}`} style={{
            padding: '6px 16px',
            background: period === p ? 'var(--s2)' : 'transparent',
            border: period === p ? '1px solid var(--b3)' : '1px solid var(--b1)',
            color: period === p ? 'var(--text-primary)' : 'var(--text-muted)',
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 9, letterSpacing: '0.15em',
            textDecoration: 'none', display: 'inline-block',
          }}>
            {PERIOD_LABELS[p]}
          </Link>
        ))}
      </div>

      {/* ── TABLE ────────────────────────────────── */}
      {!snapshots?.length ? (
        <div className="panel" style={{ padding: '48px 0', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            fontSize: 16, color: 'var(--text-muted)', letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 6,
          }}>NO RANKINGS YET</div>
          <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
            SCORES ARE CALCULATED DAILY. SUBMIT ACTIVITIES TO APPEAR ON THE BOARD.
          </div>
        </div>
      ) : (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--s2)', borderBottom: '1px solid var(--b1)' }}>
                {['#', 'OPERATIVE', 'RANK', 'SCORE'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontFamily: 'Share Tech Mono, monospace',
                    fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-muted)',
                    fontWeight: 400,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snap, i) => {
                const u    = usersMap[snap.user_id]
                const isMe = snap.user_id === user.id
                const ini  = initials(u?.full_name ?? 'UN')
                const pos  = snap.rank_position
                return (
                  <tr key={snap.user_id} style={{
                    borderBottom: i < snapshots!.length - 1 ? '1px solid var(--b1)' : 'none',
                    background: isMe ? 'var(--gold-dim)' : 'transparent',
                    boxShadow: isMe ? 'inset 0 0 0 1px var(--gold-border)' : 'none',
                  }}>
                    <td style={{ padding: '12px 16px', width: 52 }}>
                      <PositionNum pos={pos} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className={isMe ? 'hexagon' : 'hexagon'} style={{
                          width: 32, height: 32, flexShrink: 0,
                          background: isMe ? 'var(--gold)' : 'var(--s2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{
                            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                            fontSize: 11, color: isMe ? '#03060A' : 'var(--gold)',
                          }}>{ini}</span>
                        </div>
                        <div>
                          <div style={{
                            fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
                            fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em',
                            color: 'var(--text-primary)',
                          }}>
                            {u?.full_name ?? '—'}
                            {isMe && (
                              <span className="font-mono" style={{
                                marginLeft: 8, fontSize: 8,
                                padding: '1px 5px', background: 'var(--gold)',
                                color: '#03060A', letterSpacing: '0.08em',
                              }}>YOU</span>
                            )}
                          </div>
                          <div className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 1 }}>
                            @{u?.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="pill pill-active" style={{ fontSize: 8 }}>
                        {u?.rank?.replace(/_/g, ' ').toUpperCase() ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                        fontSize: pos <= 3 ? 20 : 16,
                        color: pos <= 3 ? 'var(--gold)' : 'var(--text-primary)',
                      }}>
                        {snap.score.toFixed(1)}
                      </span>
                      <span className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', marginLeft: 4 }}>PTS</span>
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
