import Card from '@/components/ui/Card'
import { Activity } from 'lucide-react'
interface Props { submitted:number; verified:number; pending:number; rejected:number }
export default function ActivitySummaryWidget({ submitted, verified, pending, rejected }: Props) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} style={{ color:'var(--gold)' }} />
        <h3 className="text-sm font-semibold" style={{ color:'var(--text-secondary)' }}>Activity (30 days)</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label:'Submitted', value:submitted, color:'var(--text-primary)' },
          { label:'Verified',  value:verified,  color:'var(--success)' },
          { label:'Pending',   value:pending,   color:'var(--pending)' },
          { label:'Rejected',  value:rejected,  color:'var(--error)' },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-3" style={{ background:'var(--bg-surface-2)' }}>
            <p className="text-xl font-bold" style={{ color:s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}