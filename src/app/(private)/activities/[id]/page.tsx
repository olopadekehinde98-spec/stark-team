import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import Card from '@/components/ui/Card'
import { formatDate, formatDateTime } from '@/lib/utils/formatDate'

export default async function ActivityDetailPage({ params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: activity } = await supabase
    .from('activities')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!activity) notFound()

  const withinEditWindow = activity.edit_locked_at && new Date(activity.edit_locked_at) > new Date()

  return (
    <div className="p-6 max-w-xl">
      <PageHeader title="Activity Details" />
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{activity.title}</h2>
          <StatusBadge status={activity.status} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Type', value: activity.activity_type },
            { label: 'Date', value: formatDate(activity.activity_date) },
            { label: 'Submitted', value: formatDateTime(activity.submitted_at) },
            { label: 'Edit window', value: withinEditWindow ? 'Open until '+formatDateTime(activity.edit_locked_at!) : 'Locked' },
          ].map(row => (
            <div key={row.label}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{row.label}</p>
              <p className="mt-0.5" style={{ color: 'var(--text-primary)' }}>{row.value}</p>
            </div>
          ))}
        </div>
        {activity.description && (
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Description</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{activity.description}</p>
          </div>
        )}
        {activity.proof_url && (
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Proof</p>
            <a href={activity.proof_url} target="_blank" rel="noopener noreferrer"
              className="text-sm" style={{ color: 'var(--gold)' }}>
              View {activity.proof_type} proof →
            </a>
          </div>
        )}
      </Card>
    </div>
  )
}