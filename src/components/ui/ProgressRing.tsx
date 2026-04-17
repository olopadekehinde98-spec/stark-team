interface ProgressRingProps {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
}

export default function ProgressRing({ value, size = 64, strokeWidth = 5, color = 'var(--gold)', label }: ProgressRingProps) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(value, 100) / 100) * circ
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={strokeWidth} stroke="var(--bg-surface-3)" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={strokeWidth} stroke={color}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
      </svg>
      {label && <span className="absolute text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</span>}
    </div>
  )
}