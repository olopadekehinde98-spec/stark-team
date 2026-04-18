import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'

export default function AdminAnnouncementsPage() {
  return (
    <div className="p-6">
      <PageHeader title="Announcements" subtitle="Manage platform announcements" />
      <Card>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          This section is under construction. Connect your Supabase project to enable full functionality.
        </p>
      </Card>
    </div>
  )
}