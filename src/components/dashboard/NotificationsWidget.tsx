import Card from '@/components/ui/Card'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils/formatDate'
interface Notif { id:string; title:string; body?:string; created_at:string; is_read:boolean }
export default function NotificationsWidget({ notifications }: { notifications:Notif[] }) {
  const unread = notifications.filter(n=>!n.is_read)
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={16} style={{ color:'var(--gold)' }} />
          <h3 className="text-sm font-semibold" style={{ color:'var(--text-secondary)' }}>Notifications</h3>
          {unread.length>0&&<span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background:'var(--gold)',color:'#0A0D14' }}>{unread.length}</span>}
        </div>
        <Link href="/notifications" className="text-xs" style={{ color:'var(--gold)' }}>View all</Link>
      </div>
      {notifications.length===0
        ? <p className="text-sm" style={{ color:'var(--text-muted)' }}>No notifications</p>
        : <div className="space-y-2">{notifications.slice(0,4).map(n=>(
            <div key={n.id} className="rounded-lg p-3" style={{ background:'var(--bg-surface-2)',opacity:n.is_read?0.6:1 }}>
              <p className="text-xs font-medium" style={{ color:'var(--text-primary)' }}>{n.title}</p>
              <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>{timeAgo(n.created_at)}</p>
            </div>
          ))}</div>
      }
    </Card>
  )
}