import { cn } from '@/lib/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean
  glow?: boolean
}

export default function Card({ className, padded = true, glow = false, children, style, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-2xl transition-all duration-200', padded && 'p-5', className)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: glow ? '0 0 24px rgba(59,130,246,0.10)' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
