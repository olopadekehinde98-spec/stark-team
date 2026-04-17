import Card from '@/components/ui/Card'
import { Trophy } from 'lucide-react'
interface Props { position:number; total:number; trend:string }
export default function LeaderboardPositionWidget({ position, total, trend }: Props) {
  const trendColor = trend==='rising'?'var(--success)':trend==='declining'?'var(--error)':'var(--text-muted)'
  const trendIcon  = trend==='rising'?'↑':trend==='declining'?'↓':'→'
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={16} style={{ color:'var(--gold)' }} />
        <h3 className="text-sm font-semibold" style={{ color:'var(--text-secondary)' }}>Leaderboard</h3>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold" style={{ color:'var(--gold)' }}>#{position||'—'}</p>
        {total>0&&<p className="text-sm mb-1" style={{ color:'var(--text-muted)' }}>of {total}</p>}
      </div>
      <p className="text-xs mt-1 font-medium" style={{ color:trendColor }}>{trendIcon} {trend}</p>
    </Card>
  )
}