import Card from '@/components/ui/Card'
import { Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatDate'
interface Goal { id:string; title:string; deadline:string; status:string }
export default function DeadlinesWidget({ goals }: { goals:Goal[] }) {
  const upcoming = goals.filter(g=>g.status==='active').slice(0,5)
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={16} style={{ color:'var(--gold)' }} />
        <h3 className="text-sm font-semibold" style={{ color:'var(--text-secondary)' }}>Upcoming Deadlines</h3>
      </div>
      {upcoming.length===0
        ? <p className="text-sm" style={{ color:'var(--text-muted)' }}>No active goals</p>
        : <div className="space-y-2">{upcoming.map(g=>{
            const overdue=new Date(g.deadline)<new Date()
            return (
              <div key={g.id} className="flex items-center justify-between">
                <p className="text-xs truncate flex-1" style={{ color:'var(--text-primary)' }}>{g.title}</p>
                <p className="text-xs ml-3 flex-shrink-0" style={{ color:overdue?'var(--error)':'var(--text-muted)' }}>{formatDate(g.deadline)}</p>
              </div>
            )
          })}</div>
      }
    </Card>
  )
}