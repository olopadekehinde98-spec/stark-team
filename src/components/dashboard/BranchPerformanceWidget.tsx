import Card from '@/components/ui/Card'
import { Users } from 'lucide-react'
interface Props { avgVerifiedRate:number; inactiveMemberCount:number; queueBacklog:number }
export default function BranchPerformanceWidget({ avgVerifiedRate, inactiveMemberCount, queueBacklog }: Props) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Users size={16} style={{ color:'var(--gold)' }} />
        <h3 className="text-sm font-semibold" style={{ color:'var(--text-secondary)' }}>Branch Health</h3>
      </div>
      <div className="space-y-3">
        {[
          { label:'Verification rate', value:Math.round(avgVerifiedRate*100)+'%', ok:avgVerifiedRate>=0.5 },
          { label:'Inactive members', value:String(inactiveMemberCount), ok:inactiveMemberCount===0 },
          { label:'Verification queue', value:String(queueBacklog), ok:queueBacklog<=10 },
        ].map(row=>(
          <div key={row.label} className="flex justify-between items-center">
            <p className="text-xs" style={{ color:'var(--text-muted)' }}>{row.label}</p>
            <p className="text-sm font-semibold" style={{ color:row.ok?'var(--success)':'var(--warning)' }}>{row.value}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}