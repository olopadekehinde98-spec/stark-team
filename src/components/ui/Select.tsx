'use client'
import { forwardRef } from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, options, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>}
      <select
        ref={ref}
        className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none ${className ?? ''}`}
        style={{ background: 'var(--bg-surface-2)', border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`, color: 'var(--text-primary)' }}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="mt-1 text-xs" style={{ color: 'var(--error)' }}>{error}</p>}
    </div>
  )
})
Select.displayName = 'Select'
export default Select
