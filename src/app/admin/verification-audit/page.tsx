import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'

export default function AdminVerificationAuditPage() {
  return (
    <div className="p-6">
      <PageHeader title="Verification Audit" subtitle="Review all verification actions" />
      <Card>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          This section is under construction. Connect your Supabase project to enable full functionality.
        </p>
      </Card>
    </div>
  )
}