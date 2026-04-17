interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        {subtitle && <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
