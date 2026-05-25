import Badge from './Badge'

type BadgeVariant = 'success' | 'warning' | 'default' | 'error' | 'pending' | 'blue' | 'cyan' | 'gold' | 'info'

const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  pending:    { label: 'Pending',    variant: 'pending' },
  verified:   { label: 'Verified',   variant: 'success' },
  unverified: { label: 'Unverified', variant: 'warning' },
  rejected:   { label: 'Rejected',   variant: 'error' },
  active:     { label: 'Active',     variant: 'success' },
  completed:  { label: 'Completed',  variant: 'info' },
  failed:     { label: 'Failed',     variant: 'error' },
  archived:   { label: 'Archived',   variant: 'default' },
}

export default function StatusBadge({ status }: { status: string }) {
  const config = statusMap[status] ?? { label: status, variant: 'default' as BadgeVariant }
  return <Badge variant={config.variant}>{config.label}</Badge>
}