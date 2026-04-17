import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type GoalTab = 'active' | 'completed' | 'failed' | 'archived'

const GOAL_TYPE_COLOR: Record<string, { border: string; label: string }> = {
  monthly:  { border: 'var(--gold)',    label: 'Monthly' },
  weekly:   { border: '#F59E0B',        label: 'Weekly'  },
  daily:    { border: '#22C55E',        label: 'Daily'   },
  custom:   { border: '#3B82F6',        label: 'Custom'  },
}

function TypeTag({ type }: { type: string }) {
  const t = GOAL_TYPE_COLOR[type] ?? { border: 'var(--text-muted)', label: type }
  return (
    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 rounded-[4px]"
      style={{
        color: t.border,
        background: `${t.border}18`,
        border: `1px solid ${t.border}40`,
        fontFamily: 'Outfit, sans-serif',
      }}>
      {t.label}
    </span>
  )
}

function daysLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now()
  const d    = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (d < 0)  return { text: `${Math.abs(d)}d overdue`, overdue: true }
  if (d === 0) return { text: 'Due today', overdue: false }
  return { text: `${d}d remaining`, overdue: false }
}

export default async function GoalsPage({
  searchParams: _sp,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const sp    = await _sp
  const tab   = (sp?.tab ?? 'active') as GoalTab
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: goals } = await supabase
    .from('goals')
    .select('id,title,goal_type,target_metric,current_metric,deadline,status,progress_pct,created_at')
    .eq('user_id', user.id)
    .eq('status', tab)
    .order('created_at', { ascending: false })

  /* Check overdue across all active goals for banner */
  const { data: overdueGoals } = await supabase
    .from('goals')
    .select('id,title,deadline')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .lt('deadline', new Date().toISOString())

  const TABS: { key: GoalTab; label: string }[] = [
    { key: 'active',    label: 'Active'    },
    { key: 'completed', label: 'Completed' },
    { key: 'failed',    label: 'Failed'    },
    { key: 'archived',  label: 'Archived'  },
  ]

  return (
    <div className="p-6 max-w-[1300px] mx-auto">

      {/* ── HEADER ───────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold"
            style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}>
            Goals
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
            Track your performance goals
          </p>
        </div>
        <Link href="/goals/create"
          className="px-4 py-2 rounded-[6px] text-[13px] font-semibold"
          style={{ background: 'var(--gold)', color: '#07090F', fontFamily: 'Outfit, sans-serif', boxShadow: '0 2px 10px rgba(201,168,76,0.25)' }}>
          + New Goal
        </Link>
      </div>

      {/* ── TABS ─────────────────────────────────── */}
      <div className="flex gap-1 mb-6 p-1 rounded-[8px] w-fit"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <Link key={t.key} href={`/goals?tab=${t.key}`}
            className="px-4 py-1.5 rounded-[6px] text-[12px] font-medium transition-all"
            style={{
              fontFamily: 'Outfit, sans-serif',
              background: tab === t.key ? 'var(--surface2)' : 'transparent',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              border: tab === t.key ? '1px solid var(--border)' : '1px solid transparent',
              textDecoration: 'none',
            }}>
            {t.label}
          </Link>
        ))}
      </div>

      {/* ── GOAL CARDS ───────────────────────────── */}
      {!goals?.length ? (
        <div className="rounded-[10px] py-20 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-[32px] mb-3">◎</p>
          <p className="text-[14px] font-semibold mb-1"
            style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}>
            No {tab} goals
          </p>
          {tab === 'active' && (
            <>
              <p className="text-[13px] mb-5" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                Create a goal to start tracking your performance.
              </p>
              <Link href="/goals/create"
                className="inline-block px-5 py-2 rounded-[6px] text-[13px] font-semibold"
                style={{ background: 'var(--gold)', color: '#07090F', fontFamily: 'Outfit, sans-serif' }}>
                + New Goal
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(goals ?? []).map(g => {
            const pct    = g.progress_pct ?? (g.target_metric > 0 ? Math.min(100, Math.round((g.current_metric / g.target_metric) * 100)) : 0)
            const dl     = daysLeft(g.deadline)
            const tColor = GOAL_TYPE_COLOR[g.goal_type]?.border ?? 'var(--text-muted)'
            return (
              <Link key={g.id} href={`/goals/${g.id}`} style={{ textDecoration: 'none' }}>
                <div className="card-hover-line rounded-[10px] p-5 h-full"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderTop: `3px solid ${tColor}`,
                  }}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <TypeTag type={g.goal_type} />
                    {tab === 'active' && (
                      <span className="text-[10px] mono flex-shrink-0"
                        style={{ color: dl.overdue ? '#EF4444' : 'var(--text-muted)' }}>
                        {dl.text}
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] font-semibold mb-4"
                    style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', lineHeight: 1.35 }}>
                    {g.title}
                  </p>
                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                        {g.current_metric ?? 0} / {g.target_metric ?? 0}
                      </span>
                      <span className="mono text-[11px] font-semibold" style={{ color: tColor }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? '#22C55E' : dl.overdue ? '#EF4444' : `linear-gradient(90deg, ${tColor}, ${tColor}cc)`,
                      }} />
                    </div>
                  </div>
                  {tab === 'active' && dl.overdue && (
                    <p className="text-[10px] mt-2"
                      style={{ color: '#EF4444', fontFamily: 'Outfit, sans-serif' }}>
                      ⚠ Goal is overdue
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── OVERDUE BANNER ───────────────────────── */}
      {tab === 'active' && overdueGoals && overdueGoals.length > 0 && (
        <div className="mt-6 rounded-[8px] px-5 py-4 flex items-start gap-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <span style={{ color: '#EF4444', fontSize: 16, flexShrink: 0 }}>⚠</span>
          <div>
            <p className="text-[12px] font-semibold mb-0.5"
              style={{ color: '#EF4444', fontFamily: 'Outfit, sans-serif' }}>
              {overdueGoals.length} {overdueGoals.length === 1 ? 'goal is' : 'goals are'} overdue
            </p>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
              {overdueGoals.map(g => g.title).join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
