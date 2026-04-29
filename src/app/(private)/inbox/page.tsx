'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  err:'#DC2626', errBg:'#FEF2F2',
  blue:'#2563EB', blueBg:'#EFF6FF',
  warn:'#D97706', warnBg:'#FFFBEB',
  gold2:'#FEF9EC', goldBd:'#F5D87A',
}

const TYPE_META: Record<string, { icon: string; color: string; bg: string }> = {
  activity_verified: { icon:'✅', color:S.ok,       bg:S.okBg    },
  activity_rejected: { icon:'❌', color:S.err,      bg:S.errBg   },
  goal_completed:    { icon:'🎯', color:S.gold,     bg:S.gold2   },
  recognition:       { icon:'🏅', color:S.gold,     bg:S.gold2   },
  rank_up:           { icon:'⬆️', color:'#7C3AED',  bg:'#F5F3FF' },
  reminder:          { icon:'⏱', color:S.warn,     bg:S.warnBg  },
  system:            { icon:'📢', color:S.blue,     bg:S.blueBg  },
  default:           { icon:'🔔', color:S.mu,       bg:S.s3      },
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric' })
}

export default function InboxPage() {
  const [items,   setItems]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<'all' | 'unread'>('all')

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => { setItems(d.notifications ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function markRead(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: 'PATCH' })
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' })
    setItems(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const displayed = filter === 'unread' ? items.filter(n => !n.is_read) : items
  const unreadCount = items.filter(n => !n.is_read).length

  return (
    <div style={{ maxWidth:680, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>
            Inbox
            {unreadCount > 0 && (
              <span style={{ marginLeft:10, fontSize:13, fontWeight:700, padding:'2px 9px', borderRadius:20, background:S.err, color:'#fff', verticalAlign:'middle' }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p style={{ fontSize:13, color:S.tx2 }}>Your notifications and team updates</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:600, background:S.s3, color:S.tx2, border:`1px solid ${S.bd}`, cursor:'pointer' }}>
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:18, background:S.s2, borderRadius:10, padding:4, width:'fit-content' }}>
        {(['all','unread'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'6px 16px', borderRadius:7, fontSize:13, fontWeight:600, border:'none', cursor:'pointer',
            background: filter === f ? S.s1 : 'transparent',
            color: filter === f ? S.tx : S.mu,
            boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}>
            {f === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ padding:48, textAlign:'center', color:S.mu, fontSize:13 }}>Loading…</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding:56, textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <div style={{ fontSize:14, fontWeight:600, color:S.tx, marginBottom:6 }}>
              {filter === 'unread' ? 'All caught up!' : 'No messages yet'}
            </div>
            <div style={{ fontSize:13, color:S.mu }}>
              {filter === 'unread' ? 'No unread notifications.' : 'Notifications will appear here.'}
            </div>
          </div>
        ) : displayed.map((n, i, arr) => {
          const meta = TYPE_META[n.notification_type] ?? TYPE_META.default
          return (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              style={{
                display:'flex', gap:14, padding:'16px 20px',
                borderBottom: i < arr.length-1 ? `1px solid ${S.bd}` : 'none',
                background: n.is_read ? S.s1 : '#FAFBFF',
                cursor: n.is_read ? 'default' : 'pointer',
                transition:'background 0.15s',
              }}
            >
              {/* Icon */}
              <div style={{ width:40, height:40, borderRadius:10, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                {meta.icon}
              </div>

              {/* Content */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
                  <div style={{ fontSize:13, fontWeight: n.is_read ? 500 : 700, color:S.tx, lineHeight:1.4 }}>
                    {n.title ?? 'Notification'}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    {!n.is_read && (
                      <div style={{ width:8, height:8, borderRadius:'50%', background:S.blue }} />
                    )}
                    <span style={{ fontSize:11, color:S.mu }}>{timeAgo(n.created_at)}</span>
                  </div>
                </div>
                {n.message && (
                  <div style={{ fontSize:12, color:S.tx2, marginTop:4, lineHeight:1.55 }}>{n.message}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
