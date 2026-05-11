'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
  warn:'#D97706', warnBg:'#FFFBEB', warnBd:'#FCD34D',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
}

const inp: React.CSSProperties = {
  width:'100%', padding:'10px 14px', borderRadius:8, fontSize:14,
  border:`1px solid ${S.bd}`, background:S.s2, color:S.tx,
  outline:'none', boxSizing:'border-box',
}

/** Nigeria time = UTC+1 */
function getNigeriaHour(): number {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utcMs + 60 * 60 * 1000).getHours()
}

function isGoalWindowOpen(): boolean {
  const h = getNigeriaHour()
  return h >= 5 && h < 12
}

function nextWindowMessage(hour: number): string {
  if (hour < 5)  return `Goal creation opens at 5:00 AM Nigeria time (${5 - hour}h away).`
  if (hour >= 12) return 'Goal creation opens again tomorrow at 5:00 AM Nigeria time.'
  return ''
}

export default function CreateGoalPage() {
  const router = useRouter()
  const [title,         setTitle]         = useState('')
  const [description,   setDescription]   = useState('')
  const [goalType,      setGoalType]      = useState('weekly')
  const [targetMetric,  setTargetMetric]  = useState('')
  const [deadline,      setDeadline]      = useState('')
  const [category,      setCategory]      = useState('')
  const [error,         setError]         = useState('')
  const [loading,       setLoading]       = useState(false)
  const [nigeriaHour,   setNigeriaHour]   = useState<number | null>(null)

  useEffect(() => {
    setNigeriaHour(getNigeriaHour())
    // refresh every minute to keep the window check live
    const t = setInterval(() => setNigeriaHour(getNigeriaHour()), 60_000)
    return () => clearInterval(t)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isGoalWindowOpen()) { setError('Goal creation is only allowed between 5:00 AM and 12:00 PM Nigeria time.'); return }
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          goal_type: goalType,
          target_metric: Number(targetMetric),
          deadline,
          category: category || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create goal'); setLoading(false); return }
    } catch {
      setError('Network error — please try again')
      setLoading(false)
      return
    }
    setLoading(false)
    router.push('/goals?tab=pending_approval')
  }

  const minDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const label = (text: string, req?: boolean) => (
    <label style={{ display:'block', fontSize:13, fontWeight:600, color:S.tx2, marginBottom:6 }}>
      {text}{req && <span style={{ color:S.err }}> *</span>}
    </label>
  )

  // Show loading state while detecting time
  if (nigeriaHour === null) {
    return (
      <div style={{ maxWidth:560, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', height:200 }}>
        <div style={{ width:24, height:24, borderRadius:'50%', border:`3px solid ${S.bd}`, borderTop:`3px solid ${S.navy}`, animation:'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const windowOpen = isGoalWindowOpen()

  return (
    <div style={{ maxWidth:560, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Create Goal</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>Set a new performance goal to track your progress</p>
      </div>

      {/* Time window notice */}
      <div style={{
        background: windowOpen ? S.okBg : S.warnBg,
        border: `1px solid ${windowOpen ? S.okBd : S.warnBd}`,
        borderRadius:10, padding:'12px 16px', marginBottom:20,
        display:'flex', alignItems:'center', gap:10,
      }}>
        <span style={{ fontSize:20 }}>{windowOpen ? '✅' : '🔒'}</span>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color: windowOpen ? S.ok : S.warn }}>
            {windowOpen ? 'Goal window is open' : 'Goal creation is locked'}
          </div>
          <div style={{ fontSize:12, color: windowOpen ? '#166534' : '#92400E', marginTop:2 }}>
            {windowOpen
              ? `Goals can be created until 12:00 PM Nigeria time. Current Nigeria time: ${nigeriaHour}:00.`
              : nextWindowMessage(nigeriaHour)}
          </div>
        </div>
      </div>

      {/* Locked state */}
      {!windowOpen ? (
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:14, padding:40, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
          <div style={{ fontSize:17, fontWeight:700, color:S.tx, marginBottom:8 }}>Goal Creation Locked</div>
          <div style={{ fontSize:13, color:S.tx2, lineHeight:1.7, marginBottom:20 }}>
            {nextWindowMessage(nigeriaHour)}
            <br />
            Goals must be written <strong>between 5:00 AM and 12:00 PM Nigeria time</strong> each day.<br />
            Come back tomorrow morning to set your daily goal.
          </div>
          <button onClick={() => router.push('/goals')} style={{
            padding:'10px 24px', borderRadius:8, fontSize:14, fontWeight:600,
            background:S.s2, color:S.tx2, border:`1px solid ${S.bd}`, cursor:'pointer',
          }}>
            ← Back to Goals
          </button>
        </div>
      ) : (
        /* Card */
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:14, padding:28, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background:S.errBg, border:`1px solid ${S.errBd}`, borderRadius:8, padding:'10px 14px', fontSize:13, color:S.err, marginBottom:20 }}>
                {error}
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {/* Title */}
              <div>
                {label('Title', true)}
                <input required value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. 10 verified activities this week" style={inp} />
              </div>

              {/* Goal Type */}
              <div>
                {label('Goal Type')}
                <select value={goalType} onChange={e => setGoalType(e.target.value)} style={inp}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Target */}
              <div>
                {label('Target (number)', true)}
                <input type="number" required min="1" value={targetMetric}
                  onChange={e => setTargetMetric(e.target.value)}
                  placeholder="e.g. 10" style={inp} />
              </div>

              {/* Deadline */}
              <div>
                {label('Deadline', true)}
                <input type="date" required min={minDate} value={deadline}
                  onChange={e => setDeadline(e.target.value)} style={inp} />
              </div>

              {/* Category */}
              <div>
                {label('Category')}
                <input value={category} onChange={e => setCategory(e.target.value)}
                  placeholder="e.g. Sales, Recruitment" style={inp} />
              </div>

              {/* Description */}
              <div>
                {label('Description')}
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                  placeholder="Describe what you want to achieve…"
                  style={{ ...inp, resize:'vertical', lineHeight:1.55, fontFamily:'inherit' }} />
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:10, paddingTop:4 }}>
                <button type="submit" disabled={loading} style={{
                  flex:1, padding:'11px', borderRadius:8, fontSize:14, fontWeight:700,
                  background: loading ? S.mu : S.navy, color:'#fff',
                  border:'none', cursor: loading ? 'not-allowed' : 'pointer',
                }}>
                  {loading ? 'Creating…' : 'Create Goal'}
                </button>
                <button type="button" onClick={() => router.push('/goals')} style={{
                  padding:'11px 20px', borderRadius:8, fontSize:14, fontWeight:600,
                  background:S.s2, color:S.tx2, border:`1px solid ${S.bd}`, cursor:'pointer',
                }}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
