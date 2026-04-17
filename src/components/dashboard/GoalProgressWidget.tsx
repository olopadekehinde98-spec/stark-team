import Card from '@/components/ui/Card'
import ProgressRing from '@/components/ui/ProgressRing'
import { Target } from 'lucide-react'
interface Props { active:number; overdue:number; completionRate:number }
export default function GoalProgressWidget({ active, overdue, completionRate }: Props) {
  const pct = Math.round(completionRate * 100)
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Target size={16} style={{ color:'var(--gold)' }} />
        <h3 className="text-sm font-semibold" style={{ color:'var(--text-secondary)' }}>Goals</h3>
      </div>
      <div className="flex items-center gap-5">
        <ProgressRing value={pct} size={72} label={pct+'%'} />
        <div className="space-y-2">
          <div>
            <p className="text-lg font-bold" style={{ color:'var(--text-primary)' }}>{active}</p>
            <p className="text-xs" style={{ color:'var(--text-muted)' }}>Active goals</p>
          </div>
          {overdue > 0 && <p className="text-sm font-semibold" style={{ color:'var(--error)' }}>{overdue} overdue</p>}
        </div>
      </div>
    </Card>
  )
}