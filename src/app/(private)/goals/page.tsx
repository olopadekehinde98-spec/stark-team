import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const S = {
  s1:'#FFFFFF',s2:'#F8FAFC',s3:'#EEF2F7',bd:'#E2E8F0',
  navy:'#0F1C2E',gold:'#D4A017',
  tx:'#0F172A',tx2:'#475569',mu:'#94A3B8',
  ok:'#16A34A',okBg:'#F0FDF4',okBd:'#86EFAC',
  warn:'#D97706',warnBg:'#FFFBEB',warnBd:'#FCD34D',
  err:'#DC2626',errBg:'#FEF2F2',errBd:'#FCA5A5',
  blue:'#2563EB',blueBg:'#EFF6FF',blueBd:'#BFDBFE',
}

const TYPE_COLORS: Record<string, string> = {
  monthly:'#D4A017', weekly:'#D97706', daily:'#2563EB', custom:'#7C3AED',
}

type GoalTab = 'pending_approval' | 'active' | 'completed' | 'rejected' | 'failed' | 'archived'

function daysLeft(deadline: string) {
  const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (d < 0)   return `${Math.abs(d)}d overdue`
  if (d === 0) return 'Due today'
  return `${d}d left`
}

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const sp  = await searchParams
  const tab = (sp.tab ?? 'active') as GoalTab

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: goals } = await supabase
    .from('goals')
    .select('id,title,goal_type,status,target_value,current_value,deadline,description')
    .eq('user_id', user.id)
    .eq('status', tab)
    .order('created_at', { ascending: false })

  const list = goals ?? []

  const TABS: { key: GoalTab; label: string }[] = [
    { key:'pending_approval', label:'Pending'   },
    { key:'active',           label:'Active'    },
    { key:'completed',        label:'Completed' },
    { key:'rejected',         label:'Rejected'  },
    { key:'failed',           label:'Failed'    },
    { key:'archived',         label:'Archived'  },
  ]

  return (
    <div>
      <style>{`
        @media(max-width:640px){
          .goals-tabs{flex-wrap:wrap !important;}
          .goals-grid{grid-template-columns:1fr !important;}
        }
        @media(min-width:641px) and (max-width:900px){
          .goals-grid{grid-template-columns:repeat(2,1fr) !important;}
        }
      `}</style>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Goals</h1>
          <p style={{ fontSize:13, color:S.tx2 }}>{list.length} {tab === 'pending_approval' ? 'pending' : tab} goal{list.length!==1?'s':''}</p>
        </div>
        <Link href="/goals/create" style={{
          padding:'9px 18px', borderRadius:8, background:S.navy,
          color:'#fff', fontSize:13, fontWeight:600, textDecoration:'none',
        }}>+ New Goal</Link>
      </div>

      {/* Tab bar */}
      <div className="goals-tabs" style={{ display:'flex', gap:4, marginBottom:18 }}>
        {TABS.map(t => (
          <Link key={t.key} href={`?tab=${t.key}`} style={{
            padding:'7px 18px', borderRadius:20, fontSize:13, fontWeight:600, textDecoration:'none',
            background: tab===t.key ? S.navy : S.s3,
            color:      tab===t.key ? '#fff' : S.tx2,
          }}>{t.label}</Link>
        ))}
      </div>

      {/* Goals grid */}
      {list.length === 0 ? (
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:48, textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>◎</div>
          <div style={{ fontSize:15, fontWeight:600, color:S.tx, marginBottom:6 }}>No {tab} goals</div>
          <div style={{ fontSize:13, color:S.mu, marginBottom:20 }}>
            {tab === 'pending_approval' ? 'No goals awaiting approval.' : tab === 'active' ? 'Set a goal to track your progress.' : `No ${tab} goals yet.`}
          </div>
          {tab === 'active' && (
            <Link href="/goals/create" style={{
              padding:'9px 20px', borderRadius:8, background:S.navy,
              color:'#fff', fontSize:13, fontWeight:600, textDecoration:'none',
            }}>Create your first goal</Link>
          )}
        </div>
      ) : (
        <div className="goals-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {list.map(g => {
            const pct   = g.target_value > 0 ? Math.min(100, Math.round(((g.current_value ?? 0) / g.target_value) * 100)) : 0
            const color = TYPE_COLORS[g.goal_type] ?? S.mu
            return (
              <Link key={g.id} href={`/goals/${g.id}`} style={{ textDecoration:'none' }}>
                <div style={{
                  background:S.s1, border:`1px solid ${S.bd}`,
                  borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
                  borderTop:`3px solid ${color}`,
                }}>
                  {/* Type tag */}
                  <div style={{ marginBottom:10 }}>
                    <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:color+'18', color }}>
                      {(g.goal_type ?? 'goal').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  </div>

                  <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:8 }}>{g.title}</div>

                  {g.description && (
                    <div style={{ fontSize:12, color:S.tx2, marginBottom:10, lineHeight:1.5 }}>{g.description}</div>
                  )}

                  {/* Progress */}
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:12, color:S.tx2 }}>{g.current_value ?? 0} / {g.target_value}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color, fontWeight:600 }}>{pct}%</span>
                  </div>
                  <div style={{ height:6, background:S.s3, borderRadius:3, overflow:'hidden', marginBottom:10 }}>
                    <div style={{ width:`${pct}%`, height:'100%', borderRadius:3, background:color }} />
                  </div>

                  {g.deadline && (
                    <div style={{ fontSize:11, color:S.mu }}>{daysLeft(g.deadline)}</div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
