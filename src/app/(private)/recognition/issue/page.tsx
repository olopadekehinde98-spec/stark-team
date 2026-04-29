'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
  blue:'#2563EB', blueBg:'#EFF6FF', blueBd:'#BFDBFE',
}

const BADGE_TYPES = [
  { value:'activity',   label:'Activity',   icon:'📋', desc:'For outstanding activity submissions' },
  { value:'goal',       label:'Goal',        icon:'🎯', desc:'For completing a goal milestone' },
  { value:'rank',       label:'Rank',        icon:'⬆️', desc:'For earning a rank promotion' },
  { value:'leadership', label:'Leadership',  icon:'👑', desc:'For showing leadership qualities' },
  { value:'custom',     label:'Special',     icon:'🏅', desc:'Custom recognition for any achievement' },
]

const inp: React.CSSProperties = {
  width:'100%', padding:'10px 13px', borderRadius:8, fontSize:13,
  border:`1px solid ${S.bd}`, background:S.s2, color:S.tx,
  outline:'none', boxSizing:'border-box',
}

export default function IssueRecognitionPage() {
  const router = useRouter()
  const [members,     setMembers]     = useState<any[]>([])
  const [recipientId, setRecipient]   = useState('')
  const [badgeType,   setBadgeType]   = useState('activity')
  const [title,       setTitle]       = useState('')
  const [message,     setMessage]     = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [canIssue,    setCanIssue]    = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: prof } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (!prof || (prof.role !== 'leader' && prof.role !== 'admin')) {
        router.push('/recognition'); return
      }
      setCanIssue(true)
      const { data: ms } = await supabase
        .from('users')
        .select('id, full_name, username, rank')
        .neq('id', user.id)
        .order('full_name')
      setMembers(ms ?? [])
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!recipientId) { setError('Please select a recipient'); return }
    if (!title.trim()) { setError('Please enter a title'); return }
    setLoading(true)
    const res = await fetch('/api/recognition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: recipientId, badge_type: badgeType, title: title.trim(), message: message.trim() }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/recognition')
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to issue badge')
    }
  }

  if (!canIssue) return (
    <div style={{ padding:40, textAlign:'center', color:S.mu, fontSize:13 }}>Checking permissions…</div>
  )

  const selectedBadge = BADGE_TYPES.find(b => b.value === badgeType)

  return (
    <div style={{ maxWidth:580 }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <button onClick={() => router.push('/recognition')}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:S.mu, padding:0, marginBottom:10 }}>
          ← Back to Recognition
        </button>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Issue Badge</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>Recognise a team member for their achievement</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:24, marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>

          {error && (
            <div style={{ background:S.errBg, border:`1px solid ${S.errBd}`, borderRadius:8, padding:'10px 14px', fontSize:13, color:S.err, marginBottom:16 }}>
              ⚠ {error}
            </div>
          )}

          {/* Recipient */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:S.mu, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
              Recipient <span style={{ color:S.err }}>*</span>
            </label>
            <select value={recipientId} onChange={e => setRecipient(e.target.value)} style={inp} required>
              <option value="">— Select team member —</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.full_name} (@{m.username})</option>
              ))}
            </select>
          </div>

          {/* Badge type */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:S.mu, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>
              Badge Type <span style={{ color:S.err }}>*</span>
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {BADGE_TYPES.map(b => (
                <button key={b.value} type="button" onClick={() => setBadgeType(b.value)}
                  style={{
                    padding:'10px 8px', borderRadius:8, border:`2px solid ${badgeType === b.value ? S.navy : S.bd}`,
                    background: badgeType === b.value ? S.navy : S.s2,
                    color: badgeType === b.value ? '#fff' : S.tx,
                    cursor:'pointer', fontSize:12, fontWeight:600,
                    display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                  }}>
                  <span style={{ fontSize:20 }}>{b.icon}</span>
                  <span>{b.label}</span>
                </button>
              ))}
            </div>
            {selectedBadge && (
              <div style={{ fontSize:12, color:S.mu, marginTop:6 }}>{selectedBadge.desc}</div>
            )}
          </div>

          {/* Title */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:S.mu, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
              Title <span style={{ color:S.err }}>*</span>
            </label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Top Performer of the Month" style={inp} required />
          </div>

          {/* Message */}
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:S.mu, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
              Personal Message (optional)
            </label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              rows={3} placeholder="Write a short note to celebrate this achievement…"
              style={{ ...inp, resize:'vertical' }} />
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <button type="button" onClick={() => router.push('/recognition')}
            style={{ padding:'10px 20px', borderRadius:8, background:'transparent', border:`1px solid ${S.bd}`, color:S.tx2, fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading}
            style={{ padding:'10px 24px', borderRadius:8, background: loading ? S.mu : S.gold, color: loading ? '#fff' : S.navy, fontSize:13, fontWeight:700, border:'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Issuing…' : '🏅 Issue Badge'}
          </button>
        </div>
      </form>
    </div>
  )
}
