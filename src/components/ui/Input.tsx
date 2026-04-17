import { cn } from '@/lib/utils/cn'
import { InputHTMLAttributes, forwardRef } from 'react'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn('w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors', className)}
      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      {...props}
    />
  )
)
Input.displayName = 'Input'
export default Input