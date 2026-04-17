'use client'
import { useState } from 'react'

interface Tab { label: string; value: string }

interface TabsProps {
  tabs: Tab[]
  defaultValue?: string
  onChange?: (value: string) => void
  children?: React.ReactNode
}

export default function Tabs({ tabs, defaultValue, onChange }: TabsProps) {
  const [active, setActive] = useState(defaultValue ?? tabs[0]?.value ?? '')

  function handleChange(value: string) {
    setActive(value)
    onChange?.(value)
  }

  return (
    <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-surface-2)' }}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => handleChange(tab.value)}
          className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={active === tab.value
            ? { background: 'var(--bg-surface-3)', color: 'var(--text-primary)' }
            : { color: 'var(--text-muted)' }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
