'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const S = {
  s1:'#FFFFFF',s2:'#F8FAFC',s3:'#EEF2F7',bd:'#E2E8F0',
  navy:'#0F1C2E',gold:'#D4A017',
  tx:'#0F172A',tx2:'#475569',mu:'#94A3B8',
  ok:'#16A34A',okBg:'#F0FDF4',okBd:'#86EFAC',
  warn:'#D97706',warnBg:'#FFFBEB',warnBd:'#FCD34D',
  err:'#DC2626',errBg:'#FEF2F2',errBd:'#FCA5A5',
  blue:'#2563EB',blueBg:'#EFF6FF',blueBd:'#BFDBFE',
}

type Activity = {
  id: string; title: string; activity_type: string; activity_date: string
  proof_url?: string; proof_type?: string; submitted_at: string; user_id: string
  users: { full_name: string; rank: string; username: string }
}

const AVATAR_PALETTES = [
  { bg:'#EFF6FF', tx:'#2563EB', bd:'#BFDBFE' },
  { bg:'#F0FDF4', tx:'#16A34A', bd:'#86EFAC' },
  { bg:'#FEF9EC', tx:'#D4A017', bd:'#F5D87A' },
  { bg:'#F5F3FF', tx:'#7C3AED', bd:'#DDD6FE' },
  { bg:'#FEF2F2', tx:'#DC2626', bd:'#FCA5A5' },
]

function initials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

function VerifyCard({
  activity, onAction, index,
}: {
  activity: Activity
  onAction: (id: string, action: 'verify' | 'reject' | 'skip', notes?: string) => void
  index: number
}) {
  const [notes, setNotes] = useState('')
  const u    = activity.users
  const pal  = AVATAR_PALETTES[index % AVATAR_PALETTES.length]
  const waitH = Math.round((Date.now() - new Date(activity.submitted_at).getTime()) / 3600000)

  return (
    <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, marginBottom:12, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ display:'flex', gap:16 }}>
        {/* Left */}
        <div style={{ flex:1 }}>
          {/* Member header */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:pal.bg, border:`1px solid ${pal.bd}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:pal.tx, flexShrink:0 }}>
              {initials(u.full_name)}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:S.tx }}>{u.full_name}</div>
              <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:3 }}>
                <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:S.s3, border:`1px solid ${S.bd}`, color:S.tx2 }}>
                  {u.rank.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </span>
                <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:S.blueBg, border:`1px solid ${S.blueBd}`, color:S.blue }}>
                  {activity.activity_type}
                </span>
              </div>
            </div>
          </div>

          <div style={{ fontSize:14, fontWeight:600, color:S.tx, marginBottom:6 }}>{activity.title}</div>
          <div style={{ fontSize:11, color:S.mu, marginBottom:14, fontFamily:"'JetBrains Mono',monospace" }}>
            {new Date(activity.activity_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
          </div>

          {/* Notes */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:600, color:S.tx2, marginBottom:5 }}>Rejection notes (optional)</div>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Reason for rejection…"
              style={{ width:'100%', padding:'8px 10px', fontSize:12, borderRadius:7, border:`1px solid ${S.bd}`, background:S.s2, color:S.tx, fontFamily:"'Inter',sans-serif", outline:'none' }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => onAction(activity.id, 'verify')} style={{
              padding:'8px 16px', borderRadius:8, border:`1px solid ${S.okBd}`,
              background:S.okBg, color:S.ok, fontSize:12, fontWeight:700, cursor:'pointer',
            }}>✓ Verify</button>
            <button onClick={() => onAction(activity.id, 'reject', notes)} style={{
              padding:'8px 16px', borderRadius:8, border:`1px solid ${S.errBd}`,
              background:S.errBg, color:S.err, fontSize:12, fontWeight:700, cursor:'pointer',
            }}>✕ Reject</button>
            <button onClick={() => onAction(activity.id, 'skip')} style={{
              padding:'8px 16px', borderRadius:8, border:`1px solid ${S.bd}`,
              background:S.s3, color:S.tx2, fontSize:12, fontWeight:600, cursor:'pointer',
            }}>Skip</button>
          </div>
        </div>

        {/* Right: proof + time */}
        <div style={{ width:160, flexShrink:0, display:'flex', flexDirection:'column', gap:10 }}>
          {activity.proof_url ? (
            <a href={activity.proof_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
              <div style={{ width:'100%', height:100, background:S.okBg, border:`1px solid ${S.okBd}`, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>📎</div>
                  <div style={{ fontSize:10, color:S.ok, fontWeight:600 }}>View Proof</div>
                </div>
              </div>
            </a>
          ) : (
            <div style={{ width:'100%', height:100, background:S.s3, border:`1px solid ${S.bd}`, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:24, marginBottom:4 }}>—</div>
                <div style={{ fontSize:10, color:S.mu }}>No proof</div>
              </div>
            </div>
          )}
          <div style={{ fontSize:11, color:S.mu, textAlign:'right', fontFamily:"'JetBrains Mono',monospace" }}>
            <div>{new Date(activity.submitted_at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
            <div style={{ color: waitH > 12 ? S.warn : S.mu, marginTop:2 }}>{waitH}h ago</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyQueueClient({
  activities: initialActivities, currentUserId, verifiedToday, avgWaitHours,
}: {
  activities: Activity[]; currentUserId: string; verifiedToday: number; avgWaitHours: number
}) {
  const [queue,      setQueue]      = useState(initialActivities)
  const [processing, setProcessing] = useState<string | null>(null)

  async function handleAction(id: string, action: 'verify' | 'reject' | 'skip', notes?: string) {
    if (action === 'skip') { setQueue(q => q.filter(a => a.id !== id)); return }
    setProcessing(id)
    const supabase = createClient()
    await fetch(`/api/verification/${id}/${action}`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ verifier_id: currentUserId, notes }),
    })
    setQueue(q => q.filter(a => a.id !== id))
    setProcessing(null)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Verify Queue</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>Review and action pending submissions from your branch</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'Queue Total',    value:queue.length,  color:S.blue,  bg:S.blueBg  },
          { label:'Verified Today', value:verifiedToday, color:S.ok,    bg:S.okBg    },
          { label:'Avg Wait',       value:`${avgWaitHours}h`, color:S.warn, bg:S.warnBg },
        ].map(s => (
          <div key={s.label} style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:11, fontWeight:600, color:S.mu, letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, letterSpacing:'-0.03em', lineHeight:1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Queue */}
      {queue.length === 0 ? (
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:48, textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>✅</div>
          <div style={{ fontSize:15, fontWeight:600, color:S.ok, marginBottom:4 }}>Queue Clear</div>
          <div style={{ fontSize:13, color:S.mu }}>All submissions have been reviewed</div>
        </div>
      ) : (
        <div>
          {queue.map((act, i) => (
            <VerifyCard key={act.id} activity={act} onAction={handleAction} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
