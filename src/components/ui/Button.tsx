import { cn } from '@/lib/utils/cn'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', style, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
    const sizes = {
      sm: 'px-3 py-1.5 text-[12px]',
      md: 'px-4 py-2.5 text-[13px]',
      lg: 'px-6 py-3 text-[14px]',
    }
    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
        color: '#fff',
        border: '1px solid rgba(59,130,246,0.35)',
        boxShadow: '0 4px 14px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      secondary: {
        background: 'var(--bg-surface-2)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border)',
      },
      ghost: {
        background: 'transparent',
        color: 'var(--text-muted)',
        border: '1px solid transparent',
      },
      outline: {
        background: 'rgba(59,130,246,0.06)',
        color: 'var(--blue-light)',
        border: '1px solid rgba(59,130,246,0.25)',
      },
      danger: {
        background: 'rgba(239,68,68,0.12)',
        color: '#F87171',
        border: '1px solid rgba(239,68,68,0.25)',
      },
    }

    return (
      <button
        ref={ref}
        className={cn(base, sizes[size], className)}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
export default Button
