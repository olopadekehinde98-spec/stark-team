'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017', goldBg:'#FEF9EC',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
  blue:'#2563EB', blueBg:'#EFF6FF', blueBd:'#BFDBFE',
  warn:'#D97706', warnBg:'#FFFBEB',
}

const TYPE: Record<string, { icon: string; color: string; bg: string }> = {
  activity_verified: { icon:'✅', color:S.ok,   bg:S.okBg   },
  activity_rejected: { icon:'❌', color:S.err,  bg:S.errBg  },
  goal_completed:    { icon:'🎯', color:S.gold, bg:S.goldBg },
  recognition:       { icon:'🏅', color:S.gold, bg:S.goldBg },
  rank_up:           { icon:'⬆️', color:'#7C3AED', bg:'#F5F3FF' },
  reminder:          { icon:'⏱', color:S.warn, bg:S.warnBg },
  system:            { icon:'📢', color:S.blue, bg:S.blueBg },
  default:           { icon:'🔔', color:S.mu,   bg:S.s3     },
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NotificationsPage() {
  const [notifs,  setNotifs]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('notifications')
        .select('id,type,title,body,created_at,is_read')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(60)
      setNotifs(data ?? [])
      setLoading(false)
      // mark all as read
      if ((data ?? []).some((n: any) => !n.is_read)) {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
      }
    })()
  }, [])

  const unread = notifs.filter(n => !n.is_read).length

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Notifications</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>
          {notifs.length} total{unread > 0 ? ` · ${unread} unread` : ' · all read'}
        </p>
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:S.mu, fontSize:13 }}>Loading…</div>
      ) : notifs.length === 0 ? (
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:60, textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔔</div>
          <div style={{ fontSize:15, fontWeight:700, color:S.tx, marginBottom:6 }}>All caught up</div>
          <div style={{ fontSize:13, color:S.mu }}>No notifications yet.</div>
        </div>
      ) : (
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          {notifs.map((n, i) => {
            const t = TYPE[n.type] ?? TYPE.default
            return (
              <div key={n.id} style={{
                display:'flex', alignItems:'flex-start', gap:14, padding:'14px 18px',
                borderBottom: i < notifs.length - 1 ? `1px solid ${S.bd}` : 'none',
                background: n.is_read ? S.s1 : S.s2,
                opacity: n.is_read ? 0.75 : 1,
              }}>
                {/* Icon */}
                <div style={{
                  width:38, height:38, borderRadius:'50%', flexShrink:0,
                  background:t.bg, display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:16, marginTop:1,
                }}>
                  {t.icon}
                </div>
                {/* Content */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight: n.is_read ? 500 : 700, color:S.tx, marginBottom:2 }}>
                    {n.title}
                  </div>
                  {n.body && (
                    <div style={{ fontSize:12, color:S.tx2, lineHeight:1.6, marginBottom:4 }}>{n.body}</div>
                  )}
                  <div style={{ fontSize:11, color:S.mu }}>{timeAgo(n.created_at)}</div>
                </div>
                {/* Unread dot */}
                {!n.is_read && (
                  <div style={{ width:8, height:8, borderRadius:'50%', background:S.gold, flexShrink:0, marginTop:6 }} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
