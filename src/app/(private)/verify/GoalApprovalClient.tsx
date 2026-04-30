'use client'
import { useState } from 'react'
import Link from 'next/link'

const S = {
  s1:'#FFFFFF',s2:'#F8FAFC',s3:'#EEF2F7',bd:'#E2E8F0',
  navy:'#0F1C2E',gold:'#D4A017',goldBg:'#FEF9EC',goldBd:'#F5D87A',
  tx:'#0F172A',tx2:'#475569',mu:'#94A3B8',
  ok:'#16A34A',okBg:'#F0FDF4',okBd:'#86EFAC',
  warn:'#D97706',warnBg:'#FFFBEB',warnBd:'#FCD34D',
  err:'#DC2626',errBg:'#FEF2F2',errBd:'#FCA5A5',
  blue:'#2563EB',blueBg:'#EFF6FF',blueBd:'#BFDBFE',
}

const TYPE_COLORS: Record<string,string> = {
  monthly:'#D4A017', weekly:'#D97706', daily:'#2563EB', custom:'#7C3AED',
}

const PALETTES = [
  { bg:'#EFF6FF', tx:'#2563EB', bd:'#BFDBFE' },
  { bg:'#F0FDF4', tx:'#16A34A', bd:'#86EFAC' },
  { bg:'#FEF9EC', tx:'#D4A017', bd:'#F5D87A' },
  { bg:'#F5F3FF', tx:'#7C3AED', bd:'#DDD6FE' },
  { bg:'#FEF2F2', tx:'#DC2626', bd:'#FCA5A5' },
]

function initials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

function daysLeft(deadline?: string) {
  if (!deadline) return null
  const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (d < 0)   return { text:`${Math.abs(d)}d overdue`, color:S.err }
  if (d === 0) return { text:'Due today', color:S.warn }
  return { text:`${d}d left`, color:S.tx2 }
}

type PendingGoal = {
  id: string
  title: string
  goal_type: string
  target_value: number
  deadline?: string
  description?: string
  created_at: string
  owner: { full_name: string; rank: string; username: string }
}

function GoalCard({
  goal, index,
  onAction,
}: {
  goal: PendingGoal
  index: number
  onAction: (id: string, action: 'approve' | 'reject' | 'skip', reason?: string) => void
}) {
  const [rejecting,   setRejecting]   = useState(false)
  const [reason,      setReason]      = useState('')
  const [processing,  setProcessing]  = useState(false)

  const pal   = PALETTES[index % PALETTES.length]
  const color = TYPE_COLORS[goal.goal_type] ?? S.mu
  const dl    = daysLeft(goal.deadline)

  async function submit(action: 'approve' | 'reject') {
    if (action === 'reject' && !reason.trim()) return
    setProcessing(true)
    await onAction(goal.id, action, reason || undefined)
    setProcessing(false)
  }

  return (
    <div style={{
      background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18,
      marginBottom:12, boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
      borderLeft:`3px solid ${color}`,
    }}>
      <div style={{ display:'flex', gap:14 }}>
        {/* Left */}
        <div style={{ flex:1 }}>
          {/* Member row */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{
              width:36, height:36, borderRadius:'50%', flexShrink:0,
              background:pal.bg, border:`1px solid ${pal.bd}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, fontWeight:700, color:pal.tx,
            }}>
              {initials(goal.owner.full_name)}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:S.tx }}>{goal.owner.full_name}</div>
              <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:3 }}>
                <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:S.s3, border:`1px solid ${S.bd}`, color:S.tx2 }}>
                  {goal.owner.rank.replace(/_/g,' ').replace(/\b\w/g,(c:string)=>c.toUpperCase())}
                </span>
                <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:color+'18', color }}>
                  {(goal.goal_type ?? 'goal').replace(/\b\w/g,(c:string)=>c.toUpperCase())}
                </span>
              </div>
            </div>
          </div>

          {/* Goal title */}
          <Link href={`/goals/${goal.id}`} style={{ textDecoration:'none' }}>
            <div style={{ fontSize:14, fontWeight:700, color:S.navy, marginBottom:4, cursor:'pointer' }}>
              {goal.title}
            </div>
          </Link>

          {/* Meta */}
          <div style={{ display:'flex', gap:12, fontSize:11, color:S.mu, marginBottom:12, flexWrap:'wrap' }}>
            <span>Target: <strong style={{ color:S.tx }}>{goal.target_value}</strong></span>
            {dl && <span style={{ color:dl.color, fontWeight:600 }}>{dl.text}</span>}
            <span>Submitted {Math.round((Date.now() - new Date(goal.created_at).getTime()) / 3600000)}h ago</span>
          </div>

          {goal.description && (
            <div style={{ fontSize:12, color:S.tx2, lineHeight:1.6, marginBottom:12, padding:'8px 10px', background:S.s2, borderRadius:6, border:`1px solid ${S.bd}` }}>
              {goal.description}
            </div>
          )}

          {/* Rejection input */}
          {rejecting && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:600, color:S.tx2, marginBottom:5 }}>
                Rejection reason <span style={{ color:S.err }}>*</span>
              </div>
              <input
                value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Explain why this goal is rejected…"
                style={{
                  width:'100%', padding:'8px 10px', fontSize:12, borderRadius:7,
                  border:`1px solid ${S.bd}`, background:S.s2, color:S.tx,
                  fontFamily:"'Inter',sans-serif", outline:'none', boxSizing:'border-box',
                }}
              />
            </div>
          )}

          {/* Action buttons */}
          {!rejecting ? (
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => submit('approve')} disabled={processing}
                style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${S.okBd}`, background:S.okBg, color:S.ok, fontSize:12, fontWeight:700, cursor:processing?'not-allowed':'pointer' }}>
                {processing ? '…' : '✓ Approve'}
              </button>
              <button onClick={() => setRejecting(true)}
                style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${S.errBd}`, background:S.errBg, color:S.err, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                ✕ Reject
              </button>
              <button onClick={() => onAction(goal.id, 'skip')}
                style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${S.bd}`, background:S.s3, color:S.tx2, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                Skip
              </button>
              <Link href={`/goals/${goal.id}`}
                style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${S.bd}`, background:'transparent', color:S.blue, fontSize:12, fontWeight:600, textDecoration:'none', display:'inline-flex', alignItems:'center' }}>
                View →
              </Link>
            </div>
          ) : (
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => submit('reject')} disabled={processing || !reason.trim()}
                style={{ padding:'8px 16px', borderRadius:8, border:'none', background:reason.trim()?S.err:S.s3, color:reason.trim()?'#fff':S.mu, fontSize:12, fontWeight:700, cursor:reason.trim()?'pointer':'not-allowed' }}>
                {processing ? '…' : 'Confirm Reject'}
              </button>
              <button onClick={() => { setRejecting(false); setReason('') }}
                style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${S.bd}`, background:S.s3, color:S.tx2, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GoalApprovalClient({
  goals: initialGoals,
}: {
  goals: PendingGoal[]
}) {
  const [queue, setQueue] = useState(initialGoals)

  async function handleAction(id: string, action: 'approve' | 'reject' | 'skip', reason?: string) {
    if (action === 'skip') { setQueue(q => q.filter(g => g.id !== id)); return }

    const endpoint = action === 'approve' ? 'approve' : 'reject'
    const body = action === 'reject' ? { rejection_reason: reason } : {}

    await fetch(`/api/goals/${id}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setQueue(q => q.filter(g => g.id !== id))
  }

  if (queue.length === 0) return (
    <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:32, textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize:24, marginBottom:8 }}>🎯</div>
      <div style={{ fontSize:14, fontWeight:600, color:S.ok, marginBottom:4 }}>No pending goals</div>
      <div style={{ fontSize:12, color:S.mu }}>All goal submissions have been reviewed</div>
    </div>
  )

  return (
    <div>
      {queue.map((goal, i) => (
        <GoalCard key={goal.id} goal={goal} index={i} onAction={handleAction} />
      ))}
    </div>
  )
}
