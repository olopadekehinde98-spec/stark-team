'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  warn:'#D97706', warnBg:'#FFFBEB', warnBd:'#FCD34D',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
  blue:'#2563EB', blueBg:'#EFF6FF', blueBd:'#BFDBFE',
}

function statusChip(status: string) {
  const map: Record<string, { bg: string; color: string; bd: string; label: string }> = {
    pending:    { bg:S.blueBg,  color:S.blue,  bd:S.blueBd,  label:'Pending' },
    verified:   { bg:S.okBg,   color:S.ok,    bd:S.okBd,   label:'Verified' },
    rejected:   { bg:S.errBg,  color:S.err,   bd:S.errBd,  label:'Rejected' },
    unverified: { bg:S.warnBg, color:S.warn,  bd:S.warnBd, label:'Unverified' },
  }
  const s = map[status] ?? { bg:S.s3, color:S.mu, bd:S.bd, label:status }
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20, background:s.bg, color:s.color, border:`1px solid ${s.bd}` }}>
      {s.label}
    </span>
  )
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
}

function fmtDateTime(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

export default function ActivityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [activity, setActivity] = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [editing,  setEditing]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  // Edit fields
  const [title,       setTitle]       = useState('')
  const [description, setDesc]        = useState('')
  const [proofUrl,    setProofUrl]    = useState('')
  const [proofType,   setProofType]   = useState('image')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
      if (error || !data) { setLoading(false); return }
      setActivity(data)
      setTitle(data.title)
      setDesc(data.description ?? '')
      setProofUrl(data.proof_url ?? '')
      setProofType(data.proof_type ?? 'image')
      setLoading(false)
    })
  }, [id])

  const withinEditWindow = activity?.edit_locked_at && new Date(activity.edit_locked_at) > new Date()
  const canEdit = activity?.status === 'pending' && withinEditWindow

  async function handleSave() {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/activities/${id}`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ title, description: description || null, proof_url: proofUrl || null, proof_type: proofUrl ? proofType : 'none' }),
    })
    const d = await res.json()
    setSaving(false)
    if (!res.ok) { setError(d.error ?? 'Failed to save'); return }
    setActivity(d)
    setEditing(false)
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'9px 12px', borderRadius:8, fontSize:13,
    border:`1px solid ${S.bd}`, background:S.s2, color:S.tx, outline:'none', boxSizing:'border-box',
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh', gap:10 }}>
      <div style={{ width:20, height:20, borderRadius:'50%', border:`3px solid ${S.bd}`, borderTop:`3px solid ${S.navy}`, animation:'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize:13, color:S.mu }}>Loading…</span>
    </div>
  )

  if (!activity) return (
    <div style={{ padding:40, textAlign:'center', color:S.err }}>Activity not found.</div>
  )

  return (
    <div style={{ maxWidth:600 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Back */}
      <button onClick={() => router.push('/activities')} style={{ marginBottom:20, fontSize:13, color:S.tx2, background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:6 }}>
        ← Back to Activities
      </button>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:S.tx, letterSpacing:'-0.02em', marginBottom:8 }}>
            {editing ? 'Edit Activity' : activity.title}
          </h1>
          {!editing && statusChip(activity.status)}
        </div>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} style={{ padding:'8px 16px', borderRadius:8, background:S.navy, color:'#fff', fontSize:12, fontWeight:700, border:'none', cursor:'pointer' }}>
            ✏️ Edit
          </button>
        )}
      </div>

      {error && (
        <div style={{ background:S.errBg, border:`1px solid ${S.errBd}`, borderRadius:8, padding:'10px 14px', fontSize:13, color:S.err, marginBottom:16 }}>{error}</div>
      )}

      {editing ? (
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:24, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:S.tx2, marginBottom:6 }}>Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:S.tx2, marginBottom:6 }}>Notes / Description</label>
              <textarea value={description} onChange={e => setDesc(e.target.value)} rows={3}
                style={{ ...inputStyle, resize:'vertical' }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:S.tx2, marginBottom:6 }}>Proof URL</label>
              <input value={proofUrl} onChange={e => setProofUrl(e.target.value)} placeholder="https://…" style={inputStyle} />
            </div>
            {proofUrl && (
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:S.tx2, marginBottom:6 }}>Proof Type</label>
                <select value={proofType} onChange={e => setProofType(e.target.value)} style={inputStyle}>
                  <option value="image">Image / Screenshot</option>
                  <option value="video_link">Video Link</option>
                  <option value="document">Document</option>
                </select>
              </div>
            )}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleSave} disabled={saving} style={{ padding:'9px 20px', borderRadius:8, background:saving?S.mu:S.ok, color:'#fff', fontSize:13, fontWeight:700, border:'none', cursor:saving?'not-allowed':'pointer' }}>
                {saving ? 'Saving…' : '✓ Save Changes'}
              </button>
              <button onClick={() => setEditing(false)} style={{ padding:'9px 16px', borderRadius:8, background:S.s3, color:S.tx2, fontSize:13, fontWeight:600, border:`1px solid ${S.bd}`, cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Edit window notice */}
          {canEdit && (
            <div style={{ background:S.warnBg, border:`1px solid ${S.warnBd}`, borderRadius:8, padding:'10px 14px', fontSize:12, color:S.warn, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              ⏱ Edit window open until {fmtDateTime(activity.edit_locked_at)}
            </div>
          )}

          {/* Info grid */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:24, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', marginBottom:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              {[
                { label:'Activity Type',  value:activity.activity_type },
                { label:'Activity Date',  value:fmtDate(activity.activity_date) },
                { label:'Submitted',      value:fmtDateTime(activity.submitted_at) },
                { label:'Edit Window',    value:canEdit ? `Open until ${fmtDateTime(activity.edit_locked_at)}` : 'Locked' },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ fontSize:11, fontWeight:600, color:S.mu, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.04em' }}>{row.label}</div>
                  <div style={{ fontSize:13, color:S.tx }}>{row.value}</div>
                </div>
              ))}
            </div>

            {activity.description && (
              <div style={{ marginTop:20, paddingTop:20, borderTop:`1px solid ${S.bd}` }}>
                <div style={{ fontSize:11, fontWeight:600, color:S.mu, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.04em' }}>Notes</div>
                <p style={{ fontSize:13, color:S.tx2, lineHeight:1.6, margin:0 }}>{activity.description}</p>
              </div>
            )}

            {activity.proof_url && (
              <div style={{ marginTop:20, paddingTop:20, borderTop:`1px solid ${S.bd}` }}>
                <div style={{ fontSize:11, fontWeight:600, color:S.mu, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.04em' }}>Proof</div>
                <a href={activity.proof_url} target="_blank" rel="noopener noreferrer" style={{
                  display:'inline-flex', alignItems:'center', gap:8, padding:'8px 14px',
                  borderRadius:8, background:S.okBg, border:`1px solid ${S.okBd}`,
                  fontSize:12, fontWeight:700, color:S.ok, textDecoration:'none',
                }}>
                  📎 View {activity.proof_type === 'video_link' ? 'Video' : activity.proof_type === 'document' ? 'Document' : 'Screenshot'} →
                </a>
              </div>
            )}

            {activity.status === 'rejected' && (
              <div style={{ marginTop:20, paddingTop:20, borderTop:`1px solid ${S.bd}` }}>
                <div style={{ fontSize:11, fontWeight:600, color:S.err, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.04em' }}>Rejection Reason</div>
                <p style={{ fontSize:13, color:S.err, margin:0 }}>Check your notifications for details.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
