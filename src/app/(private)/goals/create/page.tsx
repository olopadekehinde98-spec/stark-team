'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
}

const inp: React.CSSProperties = {
  width:'100%', padding:'10px 14px', borderRadius:8, fontSize:14,
  border:`1px solid ${S.bd}`, background:S.s2, color:S.tx,
  outline:'none', boxSizing:'border-box',
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }
    const { error: insertError } = await supabase.from('goals').insert({
      user_id: user.id, title,
      description: description || null,
      goal_type: goalType,
      target_metric: Number(targetMetric),
      deadline,
      category: category || null,
      status: 'pending_approval',
    })
    setLoading(false)
    if (insertError) { setError(insertError.message); return }
    router.push('/goals?tab=pending_approval')
  }

  const minDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const label = (text: string, req?: boolean) => (
    <label style={{ display:'block', fontSize:13, fontWeight:600, color:S.tx2, marginBottom:6 }}>
      {text}{req && <span style={{ color:S.err }}> *</span>}
    </label>
  )

  return (
    <div style={{ maxWidth:560, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Create Goal</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>Set a new performance goal to track your progress</p>
      </div>

      {/* Card */}
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
    </div>
  )
}
