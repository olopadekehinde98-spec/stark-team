'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Message = { role: 'user' | 'assistant'; content: string }

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [advice, setAdvice]     = useState('')
  const [stats, setStats]       = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('full_name,rank,role').eq('id', user.id).single()
      setStats(data)
      try {
        const res = await fetch('/api/ai-coach/advice')
        if (res.ok) { const { advice: a } = await res.json(); setAdvice(a) }
      } catch {}
      try {
        const res = await fetch('/api/ai-coach/history')
        if (res.ok) { const { messages: h } = await res.json(); setMessages(h ?? []) }
      } catch {}
    }
    load()
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai-coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      })
      if (res.ok) {
        const { reply } = await res.json()
        setMessages(m => [...m, { role: 'assistant', content: reply }])
      }
    } catch {}
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>

      {/* ── LEFT INTELLIGENCE PANEL ───────────────── */}
      <div style={{
        width: 280, flexShrink: 0, borderRight: '1px solid var(--b2)',
        display: 'flex', flexDirection: 'column', background: 'var(--s1)',
      }}>
        <div style={{
          padding: '14px 16px', borderBottom: '1px solid var(--b1)',
          borderTop: '2px solid var(--cyan)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 6, height: 6, background: 'var(--cyan)',
            borderRadius: '50%', boxShadow: '0 0 6px var(--cyan)',
            animation: 'blink 1.2s step-start infinite',
          }} />
          <span className="font-mono" style={{ fontSize: 9, letterSpacing: '0.22em', color: 'var(--cyan)' }}>
            INTELLIGENCE BRIEF
          </span>
        </div>

        {advice && (
          <div style={{
            margin: 12, padding: '10px 12px',
            background: 'rgba(32,200,224,0.06)', border: '1px solid rgba(32,200,224,0.20)',
          }}>
            <div className="font-mono" style={{ fontSize: 8, color: 'var(--cyan)', letterSpacing: '0.15em', marginBottom: 6 }}>
              [PRIORITY ALERT]
            </div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {advice}
            </div>
          </div>
        )}

        {stats && (
          <div style={{ padding: '0 12px', flex: 1 }}>
            <div className="font-mono" style={{ fontSize: 8, letterSpacing: '0.20em', color: 'var(--text-muted)', marginBottom: 8 }}>
              OPERATIVE DATA
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              {[
                { label: 'CALLSIGN', value: stats.full_name },
                { label: 'RANK',     value: stats.rank?.replace(/_/g, ' ').toUpperCase() },
                { label: 'ROLE',     value: stats.role?.toUpperCase() },
                { label: 'STATUS',   value: 'ACTIVE' },
              ].map(row => (
                <tr key={row.label} style={{ borderBottom: '1px solid var(--b1)' }}>
                  <td className="font-mono" style={{ padding: '7px 0', fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.1em', width: 72 }}>
                    {row.label}
                  </td>
                  <td style={{ padding: '7px 0 7px 8px', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: 'var(--text-primary)' }}>
                    {row.value}
                  </td>
                </tr>
              ))}
            </table>
          </div>
        )}

        <div style={{ padding: 12, borderTop: '1px solid var(--b1)' }}>
          <div className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.10em', lineHeight: 1.6 }}>
            AI COACH ANALYZES YOUR ACTIVITY PATTERNS AND PROVIDES PERSONALIZED TACTICAL RECOMMENDATIONS.
          </div>
        </div>
      </div>

      {/* ── RIGHT COMMS CHANNEL ───────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid var(--b2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.10em',
              color: 'var(--text-primary)',
            }}>COMMS CHANNEL</div>
            <div className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.15em', marginTop: 1 }}>
              AI INTELLIGENCE NETWORK
            </div>
          </div>
          {messages.length > 0 && (
            <span className="font-mono" style={{
              fontSize: 9, padding: '2px 8px',
              background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
              color: 'var(--gold)', letterSpacing: '0.08em',
            }}>{messages.length} MSG</span>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 40 }}>
              <div style={{
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                fontSize: 14, color: 'var(--text-muted)', letterSpacing: '0.12em',
                textTransform: 'uppercase', marginBottom: 6,
              }}>CHANNEL OPEN</div>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
                TRANSMIT YOUR FIRST MESSAGE TO BEGIN
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 12,
            }}>
              <div style={{
                maxWidth: '72%', padding: '10px 14px',
                background: msg.role === 'user' ? 'var(--gold-dim)' : 'var(--s2)',
                border: msg.role === 'user' ? '1px solid var(--gold-border)' : '1px solid var(--b2)',
              }}>
                <div className="font-mono" style={{
                  fontSize: 8, letterSpacing: '0.15em', marginBottom: 4,
                  color: msg.role === 'user' ? 'var(--gold)' : 'var(--cyan)',
                }}>
                  {msg.role === 'user' ? 'YOU' : 'AI COACH'}
                </div>
                <div style={{
                  fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13,
                  color: 'var(--text-primary)', lineHeight: 1.6,
                }}>{msg.content}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
              <div style={{ padding: '10px 14px', background: 'var(--s2)', border: '1px solid var(--b2)' }}>
                <div className="font-mono" style={{ fontSize: 8, color: 'var(--cyan)', letterSpacing: '0.15em', marginBottom: 4 }}>
                  AI COACH
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{
                      width: 4, height: 4, background: 'var(--cyan)',
                      animation: `blink ${0.8 + j * 0.25}s step-start infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid var(--b2)',
          display: 'flex', gap: 10,
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="TRANSMIT MESSAGE..."
            disabled={loading}
            style={{
              flex: 1, padding: '10px 14px', fontSize: 13,
              fontFamily: 'Barlow Condensed, sans-serif',
              background: 'var(--s2)', border: '1px solid var(--b2)',
              color: 'var(--text-primary)', outline: 'none',
            }}
          />
          <button
            onClick={handleSend} disabled={loading || !input.trim()}
            style={{
              padding: '10px 20px',
              background: input.trim() && !loading ? 'var(--gold)' : 'var(--s2)',
              border: 'none',
              color: input.trim() && !loading ? '#03060A' : 'var(--text-muted)',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            }}>SEND</button>
        </div>
      </div>
    </div>
  )
}
