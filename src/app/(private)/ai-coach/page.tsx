'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const S = {
  s1:'#FFFFFF',s2:'#F8FAFC',s3:'#EEF2F7',bd:'#E2E8F0',
  navy:'#0F1C2E',navy2:'#1E3A5F',gold:'#D4A017',goldBg:'#FEF9EC',goldBd:'#F5D87A',
  tx:'#0F172A',tx2:'#475569',mu:'#94A3B8',
  ok:'#16A34A',warn:'#D97706',blue:'#2563EB',
}

type Message = { role: 'user' | 'assistant'; content: string }

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [advice,   setAdvice]   = useState('')
  const [stats,    setStats]    = useState<any>(null)
  const [context,  setContext]  = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('users').select('full_name,rank,role').eq('id', user.id).single()
      setStats(prof)

      const [actsRes, goalsRes, lbRes] = await Promise.all([
        supabase.from('activities').select('status').eq('user_id', user.id),
        supabase.from('goals').select('status').eq('user_id', user.id).eq('status', 'active'),
        supabase.from('leaderboard_snapshots').select('rank_position').eq('user_id', user.id)
          .eq('period', 'monthly').order('snapshot_date', { ascending: false }).limit(1).single(),
      ])
      const acts     = actsRes.data ?? []
      const verified = acts.filter((a: any) => a.status === 'verified').length
      const rate     = acts.length > 0 ? Math.round((verified / acts.length) * 100) : 0
      setContext({ verified, rate, goals: goalsRes.data?.length ?? 0, lb: lbRes.data?.rank_position ?? null })

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

  const rankLabel = stats?.rank
    ? stats.rank.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    : ''

  return (
    <div>
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>AI Coach</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>Advice based on your real platform data</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:18 }}>
        {/* Left sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Priority alert */}
          <div style={{ background:S.navy2, borderRadius:10, padding:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#60A5FA' }} />
              <span style={{ fontSize:11, fontWeight:700, color:'#60A5FA', letterSpacing:'0.06em' }}>PRIORITY ALERT</span>
            </div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', lineHeight:1.7, marginBottom:14 }}>
              {advice || (context?.rate < 60
                ? <>Verified rate <strong style={{ color:'#fff' }}>{context?.rate}%</strong> — below branch avg. Focus on submitting activities with proof.</>
                : <>Your performance looks healthy. Keep submitting consistently to maintain your ranking.</>
              )}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[
                { label:'View Pending', href:'/activities' },
                { label:'Set Goal',     href:'/goals/create' },
              ].map(btn => (
                <a key={btn.label} href={btn.href} style={{
                  fontSize:12, color:'#60A5FA',
                  border:'1px solid rgba(96,165,250,0.3)',
                  padding:'5px 12px', borderRadius:6, fontWeight:500,
                  background:'rgba(96,165,250,0.1)', textDecoration:'none',
                }}>{btn.label}</a>
              ))}
            </div>
          </div>

          {/* Context card */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:12 }}>Your Context</div>
            {[
              { label:'Verified Acts',  value: context?.verified ?? '—', color: S.ok   },
              { label:'Verified Rate',  value: context ? `${context.rate}%` : '—', color: (context?.rate ?? 0) >= 60 ? S.ok : S.warn },
              { label:'Active Goals',   value: context?.goals ?? '—',    color: S.gold  },
              { label:'Leaderboard',    value: context?.lb ? `#${context.lb}` : '—', color:'#7C3AED' },
              { label:'Rank',           value: rankLabel || '—',         color: S.tx2  },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'8px 0', borderBottom: i<arr.length-1 ? `1px solid ${S.bd}` : 'none',
              }}>
                <span style={{ fontSize:13, color:S.tx2 }}>{row.label}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:row.color, fontWeight:600 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        <div style={{
          background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10,
          display:'flex', flexDirection:'column', overflow:'hidden',
          minHeight:480, boxShadow:'0 1px 2px rgba(0,0,0,0.04)',
        }}>
          {/* Chat header */}
          <div style={{ padding:'14px 18px', borderBottom:`1px solid ${S.bd}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:14, fontWeight:700, color:S.tx }}>Chat with your coach</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:S.mu }}>
              {messages.length} / 20 messages today
            </span>
          </div>

          {/* Messages */}
          <div style={{ flex:1, padding:18, display:'flex', flexDirection:'column', gap:14, background:S.s2, overflowY:'auto' }}>
            {messages.length === 0 && !loading && (
              <div style={{ textAlign:'center', paddingTop:40, color:S.mu, fontSize:13 }}>
                Ask your coach anything to get started
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display:'flex', gap:10, flexDirection:msg.role==='user'?'row-reverse':'row' }}>
                <div style={{
                  width:30, height:30, borderRadius:'50%', flexShrink:0,
                  background: msg.role==='user' ? S.gold : S.navy2,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:700,
                  color: msg.role==='user' ? S.navy : '#60A5FA',
                }}>
                  {msg.role==='user' ? (stats?.full_name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2) ?? 'ME') : 'AI'}
                </div>
                <div style={{
                  maxWidth:'82%', padding:'11px 14px', borderRadius:8,
                  backgroundColor: msg.role==='user' ? S.goldBg : S.navy2,
                  border:`1px solid ${msg.role==='user' ? S.goldBd : 'rgba(255,255,255,0.08)'}`,
                  fontSize:13, lineHeight:1.6,
                  color: msg.role==='user' ? S.tx : 'rgba(255,255,255,0.85)',
                }}>{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display:'flex', gap:10 }}>
                <div style={{ width:30, height:30, borderRadius:'50%', background:S.navy2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#60A5FA', flexShrink:0 }}>AI</div>
                <div style={{ padding:'11px 14px', borderRadius:8, background:S.navy2, display:'flex', gap:4, alignItems:'center' }}>
                  {[0,1,2].map(j => (
                    <div key={j} style={{ width:6, height:6, borderRadius:'50%', background:'#60A5FA', opacity:0.6 }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding:14, borderTop:`1px solid ${S.bd}`, display:'flex', gap:10, background:S.s1 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask your coach anything…"
              disabled={loading}
              style={{
                flex:1, background:S.s2, border:`1px solid ${S.bd}`,
                borderRadius:8, padding:'10px 14px',
                fontSize:13, color:S.tx, outline:'none',
                fontFamily:"'Inter',sans-serif",
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                padding:'10px 20px', borderRadius:8, border:'none',
                background: input.trim() && !loading ? S.navy : S.s3,
                color:      input.trim() && !loading ? '#fff' : S.mu,
                fontSize:13, fontWeight:600,
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  )
}
