import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressRing from '@/components/ui/ProgressRing'
import Card from '@/components/ui/Card'
import { formatDate } from '@/lib/utils/formatDate'

export default async function GoalDetailPage({ params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: goal } = await supabase.from('goals').select('*').eq('id', params.id).eq('user_id', user.id).single()
  if (!goal) notFound()

  const pct = goal.target_metric > 0 ? Math.min(100, Math.round((goal.current_metric / goal.target_metric) * 100)) : 0
  const overdue = goal.status === 'active' && new Date(goal.deadline) < new Date()

  return (
    <div className="p-6 max-w-xl">
      <PageHeader title="Goal Details" />
      <Card className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{goal.title}</h2>
          <StatusBadge status={goal.status} />
        </div>
        <div className="flex items-center gap-6">
          <ProgressRing value={pct} size={80} label={pct + '%'} />
          <div className="space-y-2 text-sm">
            <p style={{ color: 'var(--text-secondary)' }}>
              Progress: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{goal.current_metric} / {goal.target_metric}</span>
            </p>
            <p className="capitalize" style={{ color: 'var(--text-muted)' }}>Type: {goal.goal_type}</p>
            <p style={{ color: overdue ? 'var(--error)' : 'var(--text-muted)' }}>
              Deadline: {formatDate(goal.deadline)}{overdue ? ' (overdue)' : ''}
            </p>
          </div>
        </div>
        {goal.description && (
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Description</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{goal.description}</p>
          </div>
        )}
      </Card>
    </div>
  )
}