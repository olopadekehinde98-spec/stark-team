'use client'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const S = {
  s1:'#FFFFFF',s2:'#F8FAFC',s3:'#EEF2F7',bd:'#E2E8F0',
  navy:'#0F1C2E',gold:'#D4A017',
  tx:'#0F172A',tx2:'#475569',mu:'#94A3B8',
  ok:'#16A34A',okBg:'#F0FDF4',okBd:'#86EFAC',
  warn:'#D97706',warnBg:'#FFFBEB',warnBd:'#FCD34D',
  err:'#DC2626',errBg:'#FEF2F2',errBd:'#FCA5A5',
  blue:'#2563EB',blueBg:'#EFF6FF',blueBd:'#BFDBFE',
}

const TYPE_COLORS: Record<string,string> = {
  monthly:'#D4A017', weekly:'#D97706', daily:'#2563EB', custom:'#7C3AED',
}

const STATUS_LABELS: Record<string,string> = {
  pending_approval:'Pending Approval', active:'Active', completed:'Completed',
  failed:'Failed', archived:'Archived', rejected:'Rejected',
}

function statusBadgeStyle(s: string) {
  const map: Record<string,{bg:string,c:string,bd:string}> = {
    pending_approval: { bg:S.warnBg, c:S.warn, bd:S.warnBd },
    active:           { bg:S.okBg,   c:S.ok,   bd:S.okBd   },
    completed:        { bg:S.okBg,   c:S.ok,   bd:S.okBd   },
    rejected:         { bg:S.errBg,  c:S.err,  bd:S.errBd  },
    failed:           { bg:S.errBg,  c:S.err,  bd:S.errBd  },
    archived:         { bg:S.s3,     c:S.tx2,  bd:S.bd     },
  }
  const st = map[s] ?? { bg:S.s3, c:S.tx2, bd:S.bd }
  return {
    fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20,
    background:st.bg, color:st.c, border:`1px solid ${st.bd}`,
    whiteSpace:'nowrap' as const,
  }
}

function daysLeft(deadline: string) {
  const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (d < 0)   return { text:`${Math.abs(d)}d overdue`, color:S.err }
  if (d === 0) return { text:'Due today', color:S.warn }
  return { text:`${d}d left`, color:S.ok }
}

export default function GoalDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const [goal,          setGoal]         = useState<any>(null)
  const [myId,          setMyId]         = useState('')
  const [myRole,        setMyRole]       = useState('')
  const [ownerName,     setOwnerName]    = useState('')
  const [loading,       setLoading]      = useState(true)
  const [rejecting,     setRejecting]    = useState(false)
  const [rejectReason,  setRejectReason] = useState('')
  const [actionLoading, setActionLoading]= useState(false)
  const [error,         setError]        = useState('')
  const [success,       setSuccess]      = useState('')

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setMyId(user.id)

      const [{ data: prof }, { data: g }] = await Promise.all([
        supabase.from('users').select('role,rank').eq('id', user.id).single(),
        supabase.from('goals').select('*').eq('id', id).single(),
      ])

      if (!g) { router.push('/goals'); return }

      // Only allow: owner OR leader/admin
      const role = prof?.role ?? ''
      const isOwner = g.user_id === user.id
      const isLeader = role === 'leader' || role === 'admin'
      if (!isOwner && !isLeader) { router.push('/goals'); return }

      setGoal(g)
      setMyRole(role)

      if (!isOwner) {
        const { data: owner } = await supabase.from('users').select('full_name').eq('id', g.user_id).single()
        setOwnerName(owner?.full_name ?? 'Unknown')
      }
      setLoading(false)
    })()
  }, [id])

  const isOwner   = goal?.user_id === myId
  const isLeader  = myRole === 'leader' || myRole === 'admin'
  const canApprove = isLeader && !isOwner && goal?.status === 'pending_approval'

  async function handleApprove() {
    setActionLoading(true); setError('')
    const res = await fetch(`/api/goals/${id}/approve`, { method:'POST' })
    const data = await res.json()
    setActionLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed to approve'); return }
    setSuccess('Goal approved! The member has been notified.')
    setGoal((g: any) => ({ ...g, status:'active' }))
  }

  async function handleReject() {
    if (!rejectReason.trim()) { setError('Please enter a rejection reason'); return }
    setActionLoading(true); setError('')
    const res = await fetch(`/api/goals/${id}/reject`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ rejection_reason: rejectReason }),
    })
    const data = await res.json()
    setActionLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed to reject'); return }
    setSuccess('Goal rejected. The member has been notified.')
    setGoal((g: any) => ({ ...g, status:'rejected' }))
    setRejecting(false)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:32, height:32, borderRadius:'50%', border:`3px solid ${S.bd}`, borderTop:`3px solid ${S.navy}`, animation:'spin .8s linear infinite' }} />
    </div>
  )
  if (!goal) return null

  const pct   = goal.target_value > 0 ? Math.min(100, Math.round(((goal.current_value ?? 0) / goal.target_value) * 100)) : 0
  const color = TYPE_COLORS[goal.goal_type] ?? S.mu
  const dl    = goal.deadline ? daysLeft(goal.deadline) : null

  return (
    <div style={{ maxWidth:640 }}>
      {/* Back */}
      <button onClick={() => router.back()}
        style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:S.mu, padding:0, marginBottom:18, display:'flex', alignItems:'center', gap:6 }}>
        ← Back
      </button>

      {/* Alerts */}
      {success && (
        <div style={{ background:S.okBg, border:`1px solid ${S.okBd}`, borderRadius:8, padding:'12px 16px', fontSize:13, color:S.ok, marginBottom:16 }}>
          ✓ {success}
        </div>
      )}
      {error && (
        <div style={{ background:S.errBg, border:`1px solid ${S.errBd}`, borderRadius:8, padding:'12px 16px', fontSize:13, color:S.err, marginBottom:16 }}>
          ⚠ {error}
        </div>
      )}

      {/* Main card */}
      <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:24, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', borderTop:`3px solid ${color}` }}>

        {/* Who submitted (leader view) */}
        {!isOwner && ownerName && (
          <div style={{ fontSize:12, color:S.mu, marginBottom:12, padding:'8px 12px', background:S.s2, borderRadius:8, border:`1px solid ${S.bd}` }}>
            👤 Submitted by <strong style={{ color:S.tx }}>{ownerName}</strong>
          </div>
        )}

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:16, flexWrap:'wrap' }}>
          <div>
            <div style={{ marginBottom:6 }}>
              <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:color+'18', color }}>
                {(goal.goal_type ?? 'goal').replace(/\b\w/g,(c:string)=>c.toUpperCase())}
              </span>
            </div>
            <h1 style={{ fontSize:20, fontWeight:800, color:S.tx, letterSpacing:'-0.02em', margin:0, lineHeight:1.3 }}>{goal.title}</h1>
          </div>
          <span style={statusBadgeStyle(goal.status)}>{STATUS_LABELS[goal.status] ?? goal.status}</span>
        </div>

        {/* Description */}
        {goal.description && (
          <p style={{ fontSize:13, color:S.tx2, lineHeight:1.7, marginBottom:20, padding:'12px 14px', background:S.s2, borderRadius:8, border:`1px solid ${S.bd}`, margin:'0 0 20px' }}>
            {goal.description}
          </p>
        )}

        {/* Progress bar */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:600, color:S.tx2 }}>Progress</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:800, color }}>{pct}%</span>
          </div>
          <div style={{ height:10, background:S.s3, borderRadius:5, overflow:'hidden', marginBottom:6 }}>
            <div style={{ width:`${pct}%`, height:'100%', borderRadius:5, background:color, transition:'width .4s ease' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:S.mu }}>Current: <strong style={{ color:S.tx }}>{goal.current_value ?? 0}</strong></span>
            <span style={{ fontSize:12, color:S.mu }}>Target: <strong style={{ color:S.tx }}>{goal.target_value}</strong></span>
          </div>
        </div>

        {/* Meta grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            { label:'Deadline', value: goal.deadline
                ? new Date(goal.deadline).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})
                : 'No deadline' },
            { label:'Days Left', value: dl?.text ?? '—', valueColor: dl?.color },
            { label:'Type', value:(goal.goal_type ?? 'goal').replace(/\b\w/g,(c:string)=>c.toUpperCase()) },
            { label:'Created', value: new Date(goal.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) },
          ].map(m => (
            <div key={m.label} style={{ background:S.s2, borderRadius:8, padding:'10px 14px', border:`1px solid ${S.bd}` }}>
              <div style={{ fontSize:10, fontWeight:600, color:S.mu, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>{m.label}</div>
              <div style={{ fontSize:13, fontWeight:600, color:(m as any).valueColor ?? S.tx }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Rejection reason (if rejected) */}
        {goal.status === 'rejected' && goal.rejection_reason && (
          <div style={{ marginTop:16, background:S.errBg, border:`1px solid ${S.errBd}`, borderRadius:8, padding:'12px 16px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:S.err, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Rejection Reason</div>
            <div style={{ fontSize:13, color:S.err }}>{goal.rejection_reason}</div>
          </div>
        )}
      </div>

      {/* Approval panel (leader / admin only, pending goals) */}
      {canApprove && !success && (
        <div style={{ marginTop:16, background:S.s1, border:`1px solid ${S.warnBd}`, borderRadius:12, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:14, fontWeight:700, color:S.warn, marginBottom:4 }}>⏳ Awaiting Your Approval</div>
          <p style={{ fontSize:13, color:S.tx2, marginBottom:16, lineHeight:1.65 }}>
            This goal needs your approval before it becomes active. Review the details above, then approve or reject.
          </p>

          {!rejecting ? (
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleApprove} disabled={actionLoading}
                style={{ flex:1, padding:'11px 0', borderRadius:8, border:`1px solid ${S.okBd}`,
                  background:S.okBg, color:S.ok, fontSize:13, fontWeight:700,
                  cursor:actionLoading?'not-allowed':'pointer' }}>
                {actionLoading ? '…' : '✓ Approve Goal'}
              </button>
              <button onClick={() => { setRejecting(true); setError('') }}
                style={{ flex:1, padding:'11px 0', borderRadius:8, border:`1px solid ${S.errBd}`,
                  background:S.errBg, color:S.err, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                ✕ Reject Goal
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:S.mu, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                Rejection Reason <span style={{ color:S.err }}>*</span>
              </div>
              <textarea
                value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Explain why this goal is being rejected…" rows={3}
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:`1px solid ${S.bd}`,
                  fontSize:13, color:S.tx, background:S.s2, resize:'vertical',
                  fontFamily:"'Inter',sans-serif", outline:'none', boxSizing:'border-box' }}
              />
              <div style={{ display:'flex', gap:10, marginTop:10 }}>
                <button onClick={handleReject} disabled={actionLoading}
                  style={{ flex:1, padding:'11px 0', borderRadius:8, border:'none',
                    background:S.err, color:'#fff', fontSize:13, fontWeight:700,
                    cursor:actionLoading?'not-allowed':'pointer' }}>
                  {actionLoading ? '…' : 'Confirm Rejection'}
                </button>
                <button onClick={() => { setRejecting(false); setError('') }}
                  style={{ padding:'11px 20px', borderRadius:8, border:`1px solid ${S.bd}`,
                    background:S.s3, color:S.tx2, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending info (owner view) */}
      {isOwner && goal.status === 'pending_approval' && (
        <div style={{ marginTop:16, background:S.warnBg, border:`1px solid ${S.warnBd}`, borderRadius:12, padding:20 }}>
          <div style={{ fontSize:14, fontWeight:700, color:S.warn, marginBottom:6 }}>⏳ Waiting for Approval</div>
          <p style={{ fontSize:13, color:S.warn, lineHeight:1.65, margin:0 }}>
            Your goal has been submitted and is waiting for your leader to review and approve it. You'll get a notification once it's actioned.
          </p>
        </div>
      )}
    </div>
  )
}
