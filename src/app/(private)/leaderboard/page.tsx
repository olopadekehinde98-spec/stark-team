import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const S = {
  s1:'#FFFFFF',s2:'#F8FAFC',s3:'#EEF2F7',bd:'#E2E8F0',
  navy:'#0F1C2E',gold:'#D4A017',goldBg:'#FEF9EC',goldBd:'#F5D87A',
  tx:'#0F172A',tx2:'#475569',mu:'#94A3B8',
  ok:'#16A34A',okBg:'#F0FDF4',okBd:'#86EFAC',
  blue:'#2563EB',
}

const PALETTES = [
  { bg:'#FEF9EC', tx:'#D4A017', bd:'#F5D87A' },
  { bg:'#EFF6FF', tx:'#2563EB', bd:'#BFDBFE' },
  { bg:'#F0FDF4', tx:'#16A34A', bd:'#86EFAC' },
  { bg:'#F5F3FF', tx:'#7C3AED', bd:'#DDD6FE' },
  { bg:'#FEF2F2', tx:'#DC2626', bd:'#FCA5A5' },
]

type Period = 'daily' | 'weekly' | 'monthly' | 'all_time'

function initials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

const MEDAL = ['🥇','🥈','🥉']

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const sp     = await searchParams
  const period = (sp.period ?? 'monthly') as Period

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [entriesRes, myRes] = await Promise.all([
    supabase
      .from('leaderboard_snapshots')
      .select('user_id,rank_position,score,users(full_name,rank)')
      .eq('period', period)
      .order('rank_position')
      .limit(50),
    supabase
      .from('leaderboard_snapshots')
      .select('rank_position,score')
      .eq('user_id', user.id)
      .eq('period', period)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const entries = entriesRes.data ?? []
  const myEntry = myRes.data

  const PERIODS: { key: Period; label: string }[] = [
    { key:'daily',    label:'Daily'    },
    { key:'weekly',   label:'Weekly'   },
    { key:'monthly',  label:'Monthly'  },
    { key:'all_time', label:'All-Time' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Leaderboard</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>
          {myEntry ? `Your rank: #${myEntry.rank_position} · ${myEntry.score ?? 0} pts` : 'Monthly performance rankings'}
        </p>
      </div>

      {/* Period selector */}
      <div style={{ display:'flex', gap:4, marginBottom:18 }}>
        {PERIODS.map(p => (
          <Link key={p.key} href={`?period=${p.key}`} style={{
            padding:'7px 18px', borderRadius:20, fontSize:13, fontWeight:600, textDecoration:'none',
            background: period===p.key ? S.navy : S.s3,
            color:      period===p.key ? '#fff' : S.tx2,
          }}>{p.label}</Link>
        ))}
      </div>

      {/* Rankings */}
      <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        {entries.length === 0 ? (
          <div style={{ padding:48, textAlign:'center', color:S.mu, fontSize:13 }}>
            No rankings yet for this period.
          </div>
        ) : entries.map((e, i) => {
          const name    = (e.users as any)?.full_name ?? 'Unknown'
          const rank    = (e.users as any)?.rank ?? ''
          const isMe    = e.user_id === user.id
          const pal     = PALETTES[i % PALETTES.length]
          const isTop3  = i < 3

          return (
            <div key={e.user_id} style={{
              display:'flex', alignItems:'center', gap:14, padding:'14px 18px',
              borderBottom: i < entries.length-1 ? `1px solid ${S.bd}` : 'none',
              background: isMe ? S.goldBg : 'transparent',
              ...(isMe ? { border:`1px solid ${S.goldBd}` } : {}),
            }}>
              {/* Position */}
              <div style={{ width:32, textAlign:'center', flexShrink:0 }}>
                {isTop3
                  ? <span style={{ fontSize:20 }}>{MEDAL[i]}</span>
                  : <span style={{ fontSize:14, fontWeight:700, color:S.mu, fontFamily:"'JetBrains Mono',monospace" }}>#{i+1}</span>
                }
              </div>

              {/* Avatar */}
              <div style={{
                width:36, height:36, borderRadius:'50%', flexShrink:0,
                background: isMe ? S.gold : pal.bg,
                border:`1px solid ${isMe ? S.goldBd : pal.bd}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:700,
                color: isMe ? S.navy : pal.tx,
              }}>{initials(name)}</div>

              {/* Name + rank */}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:S.tx }}>
                  {name} {isMe && <span style={{ fontSize:10, color:S.gold, fontWeight:700 }}>· You</span>}
                </div>
                <div style={{ fontSize:11, color:S.mu }}>
                  {rank.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </div>
              </div>

              {/* Score */}
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:15, fontWeight:800, color: isTop3 ? S.gold : S.tx }}>
                  {e.score ?? 0}
                </div>
                <div style={{ fontSize:10, color:S.mu }}>pts</div>
              </div>

              {/* Arrow for top 3 */}
              {isTop3 && (
                <span style={{ color:S.ok, fontSize:14, flexShrink:0 }}>↑</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
