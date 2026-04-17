interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-base font-semibold" style={{ color: 'var(--text-secondary)' }}>{title}</p>
      {description && <p className="mt-1 text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}