import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const TYPE_ICON: Record<string, { icon: string; color: string }> = {
  activity_verified: { icon: '✓',  color: '#22C55E' },
  activity_rejected: { icon: '✗',  color: '#EF4444' },
  goal_completed:    { icon: '◎',  color: '#C9A84C' },
  recognition:       { icon: '✦',  color: '#E8C96A' },
  rank_up:           { icon: '▲',  color: '#8B5CF6' },
  reminder:          { icon: '⏱', color: '#F59E0B' },
  system:            { icon: '⊙',  color: '#3B82F6' },
  default:           { icon: '◉',  color: '#6B7A96' },
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m    = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id,type,title,body,created_at,is_read')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(60)

  const unread = notifications?.filter(n => !n.is_read).length ?? 0

  // Auto-mark all as read when page is visited
  if (unread > 0) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user!.id).eq('is_read', false)
  }

  return (
    <div className="p-6 max-w-[760px] mx-auto">

      {/* ── HEADER ───────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold"
            style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}>
            Notifications
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
            {notifications?.length ?? 0} notifications
          </p>
        </div>
      </div>

      {/* ── LIST ─────────────────────────────────── */}
      {!notifications?.length ? (
        <div className="rounded-[10px] py-20 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-[32px] mb-3">◉</p>
          <p className="text-[14px] font-semibold mb-1"
            style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}>
            All caught up
          </p>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
            No notifications yet.
          </p>
        </div>
      ) : (
        <div className="rounded-[10px] overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {notifications.map((n, i) => {
            const typeStyle = TYPE_ICON[n.type ?? 'default'] ?? TYPE_ICON.default
            const isLast    = i === notifications.length - 1
            return (
              <div key={n.id}
                className="flex items-start gap-4 px-5 py-4 transition-all"
                style={{
                  borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  opacity: n.is_read ? 0.65 : 1,
                  background: n.is_read ? 'transparent' : 'rgba(201,168,76,0.025)',
                }}>
                {/* Icon circle */}
                <div className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{
                    width: 34, height: 34,
                    background: `${typeStyle.color}14`,
                    border: `1px solid ${typeStyle.color}30`,
                    color: typeStyle.color,
                    fontSize: 13,
                    marginTop: 2,
                  }}>
                  {typeStyle.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium"
                    style={{ color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-[12px] mt-0.5 leading-relaxed"
                      style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                      {n.body}
                    </p>
                  )}
                  <p className="mono text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    {timeAgo(n.created_at)}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.is_read && (
                  <div className="flex-shrink-0 mt-2">
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--gold)',
                      boxShadow: '0 0 6px rgba(201,168,76,0.5)',
                      display: 'block',
                    }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
