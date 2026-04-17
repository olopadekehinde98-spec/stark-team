import { cn } from '@/lib/utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'pending' | 'info' | 'gold' | 'blue' | 'cyan'
  className?: string
}

const variantStyles: Record<string, React.CSSProperties> = {
  default: { background: 'rgba(59,130,246,0.08)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.15)' },
  success: { background: 'rgba(16,185,129,0.10)', color: '#34D399', border: '1px solid rgba(16,185,129,0.20)' },
  warning: { background: 'rgba(245,158,11,0.10)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.20)' },
  error:   { background: 'rgba(239,68,68,0.10)',  color: '#F87171', border: '1px solid rgba(239,68,68,0.20)' },
  pending: { background: 'rgba(139,92,246,0.10)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.20)' },
  info:    { background: 'rgba(59,130,246,0.10)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.22)' },
  blue:    { background: 'rgba(59,130,246,0.10)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.22)' },
  cyan:    { background: 'rgba(6,182,212,0.10)',  color: '#22D3EE', border: '1px solid rgba(6,182,212,0.22)' },
  gold:    { background: 'rgba(245,158,11,0.10)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.25)' },
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold tracking-wide', className)}
      style={variantStyles[variant]}>
      {children}
    </span>
  )
}
