import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'

export default function AdminAlertsPage() {
  return (
    <div className="p-6">
      <PageHeader title="Alerts" subtitle="System alerts and notifications" />
      <Card>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          This section is under construction. Connect your Supabase project to enable full functionality.
        </p>
      </Card>
    </div>
  )
}