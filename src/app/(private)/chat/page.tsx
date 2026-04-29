'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7',
  bd:'#E2E8F0', bd2:'#CBD5E1',
  navy:'#0F1C2E', navy2:'#1E3A5F',
  gold:'#D4A017',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', err:'#DC2626', blue:'#2563EB',
  blueBg:'#EFF6FF',
}

const CHANNELS = [
  { id: 'general',    label: '# general',    desc: 'Open to everyone',       leaderOnly: false },
  { id: 'branch',     label: '# branch',     desc: 'Your branch members',    leaderOnly: false },
  { id: 'inbox',      label: '📥 inbox',     desc: 'Team inbox',             leaderOnly: false },
  { id: 'leadership', label: '# leadership', desc: 'Leaders & admins only',  leaderOnly: true  },
]

const RANK_COLOR: Record<string, string> = {
  distributor:    '#94A3B8',
  manager:        '#2563EB',
  senior_manager: '#7C3AED',
  director:       '#D97706',
  executive:      '#D4A017',
}

function getInitials(name: string) {
  return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'
}
function rankLabel(r: string) {
  return r ? r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''
}
function fmtTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ChatPage() {
  const [profile,    setProfile]    = useState<any>(null)
  const [channel,    setChannel]    = useState('general')
  const [messages,   setMessages]   = useState<any[]>([])
  const [input,      setInput]      = useState('')
  const [sending,    setSending]    = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  // Load current user profile
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('users').select('id, full_name, rank, role').eq('id', user.id).single()
        .then(({ data }) => setProfile(data))
    })
  }, [])

  // Fetch messages for current channel
  const fetchMessages = useCallback(async (ch: string) => {
    setLoading(true)
    const res = await fetch(`/api/chat?channel=${ch}&limit=50`)
    const json = await res.json()
    setMessages(json.messages ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMessages(channel)
  }, [channel, fetchMessages])

  // Scroll to bottom when messages load / change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const sub = supabase
      .channel(`chat:${channel}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_messages', filter: `channel=eq.${channel}` },
        async (payload) => {
          const row = payload.new as any
          if (row.is_deleted) return
          // Fetch user info for new message
          const { data: u } = await supabase
            .from('users')
            .select('full_name, rank')
            .eq('id', row.user_id)
            .single()
          setMessages(prev => [...prev, { ...row, users: u }])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'team_messages', filter: `channel=eq.${channel}` },
        (payload) => {
          const row = payload.new as any
          if (row.is_deleted) {
            setMessages(prev => prev.filter(m => m.id !== row.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [channel])

  const send = async () => {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    setError('')

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, content }),
    })
    const json = await res.json()
    setSending(false)

    if (!res.ok) { setError(json.error ?? 'Failed to send'); return }
    setInput('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const deleteMsg = async (id: string) => {
    await fetch(`/api/chat?id=${id}`, { method: 'DELETE' })
  }

  const isLeaderOrAdmin = profile?.role === 'leader' || profile?.role === 'admin'

  // Group messages by sender+time proximity
  const grouped = messages.reduce<any[]>((acc, msg, i) => {
    const prev = messages[i - 1]
    const sameUser = prev?.user_id === msg.user_id
    const sameBlock = sameUser && (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) < 5 * 60_000
    acc.push({ ...msg, showHeader: !sameBlock })
    return acc
  }, [])

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 112px)', gap: 0, borderRadius: 12, overflow: 'hidden', border: `1px solid ${S.bd}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 220, background: S.navy, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Team Chat</div>
        </div>

        <div style={{ padding: '10px 8px', flex: 1 }}>
          {CHANNELS.filter(c => !c.leaderOnly || isLeaderOrAdmin).map(c => (
            <button
              key={c.id}
              onClick={() => setChannel(c.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 12px',
                borderRadius: 7, border: 'none', cursor: 'pointer',
                background: channel === c.id ? 'rgba(255,255,255,0.13)' : 'transparent',
                color: channel === c.id ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: 13, fontWeight: channel === c.id ? 600 : 400,
                marginBottom: 2, transition: 'all 0.15s',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {profile && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', background: S.gold, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: S.navy,
            }}>{getInitials(profile.full_name)}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{profile.full_name?.split(' ')[0]}</div>
              <div style={{ fontSize: 10, color: S.gold }}>{rankLabel(profile.rank)}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main chat area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: S.s1, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${S.bd}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ fontSize: 18, color: S.navy2 }}>#</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: S.tx }}>{channel}</div>
            <div style={{ fontSize: 12, color: S.mu }}>{CHANNELS.find(c => c.id === channel)?.desc}</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: S.mu }}>{messages.length} messages</div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <div style={{ fontSize: 13, color: S.mu }}>Loading messages…</div>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8 }}>
              <div style={{ fontSize: 36 }}>💬</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: S.tx }}>No messages yet</div>
              <div style={{ fontSize: 13, color: S.mu }}>Be the first to say something in #{channel}</div>
            </div>
          ) : (
            grouped.map((msg) => {
              const isMine = msg.user_id === profile?.id
              const uRank  = msg.users?.rank ?? ''
              const dotColor = RANK_COLOR[uRank] ?? S.mu

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex', gap: 10,
                    padding: msg.showHeader ? '12px 8px 4px' : '2px 8px',
                    borderRadius: 8,
                    background: isMine ? S.blueBg : 'transparent',
                  }}
                  className="msg-row"
                >
                  {msg.showHeader ? (
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: dotColor, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#fff',
                    }}>
                      {getInitials(msg.users?.full_name ?? '?')}
                    </div>
                  ) : (
                    <div style={{ width: 34, flexShrink: 0 }} />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {msg.showHeader && (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: S.tx }}>{msg.users?.full_name ?? 'Unknown'}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: dotColor }}>{rankLabel(uRank)}</span>
                        <span style={{ fontSize: 11, color: S.mu, marginLeft: 'auto' }}>{fmtTime(msg.created_at)}</span>
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: S.tx2, lineHeight: 1.55, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </div>
                  </div>

                  {(isMine || isLeaderOrAdmin) && (
                    <button
                      onClick={() => deleteMsg(msg.id)}
                      title="Delete"
                      style={{
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        fontSize: 13, color: S.mu, padding: '2px 4px', borderRadius: 4,
                        opacity: 0, transition: 'opacity 0.15s', flexShrink: 0,
                        alignSelf: 'flex-start',
                      }}
                      className="del-btn"
                    >✕</button>
                  )}
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${S.bd}`, flexShrink: 0 }}>
          {error && (
            <div style={{ fontSize: 12, color: S.err, marginBottom: 8, padding: '6px 10px', background: '#FEF2F2', borderRadius: 6 }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${channel}…`}
              rows={1}
              style={{
                flex: 1, borderRadius: 10, border: `1px solid ${S.bd}`,
                padding: '10px 14px', fontSize: 13, color: S.tx,
                background: S.s2, outline: 'none', resize: 'none',
                fontFamily: "'Inter', sans-serif", lineHeight: 1.5,
                maxHeight: 120, overflowY: 'auto',
              }}
              onInput={e => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 120) + 'px'
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: input.trim() && !sending ? S.navy : S.bd,
                color: input.trim() && !sending ? '#fff' : S.mu,
                fontSize: 13, fontWeight: 600, cursor: input.trim() && !sending ? 'pointer' : 'default',
                transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: S.mu, marginTop: 6 }}>Enter to send · Shift+Enter for new line</div>
        </div>
      </div>

      <style>{`
        .msg-row:hover .del-btn { opacity: 1 !important; }
        .msg-row:hover { background: ${S.s3} !important; }
      `}</style>
    </div>
  )
}
