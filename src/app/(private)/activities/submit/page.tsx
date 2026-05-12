'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
  blue:'#2563EB', blueBg:'#EFF6FF', blueBd:'#BFDBFE',
  warn:'#D97706', warnBg:'#FFFBEB', warnBd:'#FCD34D',
}

const STEPS = ['Details', 'Link Goal', 'Upload Proof', 'Confirm & Submit']

const inp: React.CSSProperties = {
  width:'100%', padding:'10px 13px', borderRadius:8, fontSize:13,
  border:`1px solid ${S.bd}`, background:S.s2, color:S.tx,
  outline:'none', boxSizing:'border-box',
  fontFamily:"'Inter',sans-serif",
}

export default function SubmitActivityPage() {
  const router = useRouter()

  const [step,        setStep]        = useState(0)
  const [templates,   setTemplates]   = useState<any[]>([])
  const [goals,       setGoals]       = useState<any[]>([])
  const [goalsLoaded, setGoalsLoaded] = useState(false)
  const [title,       setTitle]       = useState('')
  const [actType,     setActType]     = useState('')
  const [templateId,  setTemplateId]  = useState('')
  const [actDate,     setActDate]     = useState(new Date().toISOString().split('T')[0])
  const [description, setDesc]        = useState('')
  const [goalId,      setGoalId]      = useState('')
  const [proofUrl,     setProofUrl]    = useState('')
  const [proofType,    setProofType]   = useState('image')
  const [proofMode,    setProofMode]   = useState<'link' | 'upload'>('upload')
  const [proofFile,    setProofFile]   = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState('')
  const [uploading,    setUploading]   = useState(false)
  const [loading,      setLoading]     = useState(false)
  const [error,        setError]       = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('activity_templates').select('id,name,proof_required').eq('is_active', true)
      .then(({ data }) => setTemplates(data ?? []))
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('goals').select('id,title').eq('user_id', user.id).eq('status','active')
      setGoals(data ?? [])
      setGoalsLoaded(true)
    })
  }, [])

  const selectedTemplate = templates.find(t => t.id === templateId)
  const proofRequired    = selectedTemplate?.proof_required ?? false
  const hasProof = proofMode === 'link' ? proofUrl.trim().length > 0 : !!proofFile

  function canNext() {
    if (step === 0) return title.trim().length > 0 && actType.trim().length > 0 && !!actDate
    // Step 1: goal is REQUIRED
    if (step === 1) return !!goalId
    if (step === 2) return !proofRequired || hasProof
    return true
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('File must be under 10MB'); return }
    setProofFile(file)
    setProofType('image')
    setProofPreview(URL.createObjectURL(file))
    setError('')
  }

  async function handleSubmit() {
    setError('')
    if (!goalId) { setError('You must link this activity to one of your daily goals.'); return }
    if (proofRequired && !hasProof) { setError('Proof is required for this activity type'); return }

    let finalProofUrl  = proofUrl
    let finalProofType = proofUrl ? proofType : 'none'

    // Upload proof image first if needed
    if (proofMode === 'upload' && proofFile) {
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', proofFile)
        const res  = await fetch('/api/activities/upload-proof', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) { setError('Upload failed: ' + (data.error ?? 'Unknown error')); setUploading(false); return }
        finalProofUrl  = data.url
        finalProofType = 'image'
      } catch {
        setError('Upload failed: network error')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    setLoading(true)
    // Submit via server API — goal completion handled server-side (bypasses RLS)
    const res = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description:   description || null,
        activity_type: actType || selectedTemplate?.name || title,
        template_id:   templateId || null,
        goal_id:       goalId,
        activity_date: actDate,
        proof_url:     finalProofUrl || null,
        proof_type:    finalProofType,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed to submit activity'); return }
    router.push('/activities')
  }

  const label = (text: string, required = false) => (
    <div style={{ fontSize:11, fontWeight:600, color:S.mu, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
      {text}{required && <span style={{ color:S.err }}> *</span>}
    </div>
  )

  return (
    <div style={{ maxWidth:580 }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <button onClick={() => router.push('/activities')}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:S.mu, padding:0, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
          ← Back to Activities
        </button>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Submit Activity</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>Log your field activity for verification and leaderboard points</p>
      </div>

      {/* Step indicators */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:24, gap:0 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
              <div style={{
                width:26, height:26, borderRadius:'50%', fontSize:11, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center',
                background: i < step ? S.ok : i === step ? S.navy : S.s3,
                color:      i < step ? '#fff' : i === step ? '#fff' : S.mu,
                border:    `1px solid ${i < step ? S.ok : i === step ? S.navy : S.bd}`,
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize:12, fontWeight:600, color: i === step ? S.tx : S.mu, whiteSpace:'nowrap' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex:1, height:1, background: i < step ? S.ok : S.bd, margin:'0 10px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:24, marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>

        {error && (
          <div style={{ background:S.errBg, border:`1px solid ${S.errBd}`, borderRadius:8, padding:'10px 14px', fontSize:13, color:S.err, marginBottom:16 }}>
            ⚠ {error}
          </div>
        )}

        {/* STEP 0: Details */}
        {step === 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              {label('Activity template (optional)')}
              <select value={templateId} onChange={e => {
                setTemplateId(e.target.value)
                const t = templates.find(t => t.id === e.target.value)
                if (t) setActType(t.name)
              }} style={inp}>
                <option value="">No template — fill in manually</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}{t.proof_required ? ' (proof required)' : ''}</option>
                ))}
              </select>
            </div>
            {proofRequired && (
              <div style={{ background:S.warnBg, border:`1px solid ${S.warnBd}`, borderRadius:8, padding:'10px 14px', fontSize:12, color:S.warn }}>
                ⚠ Proof upload is required for this activity type
              </div>
            )}
            <div>
              {label('Title', true)}
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sales call with Mr Ade" style={inp} />
            </div>
            <div>
              {label('Activity type', true)}
              <input value={actType} onChange={e => setActType(e.target.value)} placeholder="e.g. Sales Call, Client Meeting…" style={inp} />
            </div>
            <div>
              {label('Activity date', true)}
              <input type="date" value={actDate} onChange={e => setActDate(e.target.value)} style={inp} max={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              {label('Notes / Description')}
              <textarea value={description} onChange={e => setDesc(e.target.value)}
                placeholder="Brief description of what you did…" rows={3}
                style={{ ...inp, resize:'vertical' }} />
            </div>
          </div>
        )}

        {/* STEP 1: Link Goal — REQUIRED */}
        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Required notice */}
            <div style={{ background:S.warnBg, border:`1px solid ${S.warnBd}`, borderRadius:8, padding:'12px 14px', fontSize:13, color:S.warn, display:'flex', gap:8, alignItems:'flex-start' }}>
              <span>⚠️</span>
              <div>
                <strong>Goal is required.</strong> You must link this activity to your written daily goal.
                Activities submitted without a goal will be blocked. This ensures accountability and tracks your daily commitments.
              </div>
            </div>

            {!goalsLoaded ? (
              <div style={{ padding:20, textAlign:'center', color:S.mu, fontSize:13 }}>Loading goals…</div>
            ) : goals.length === 0 ? (
              /* No active goals — block with explanation */
              <div style={{ background:S.errBg, border:`1px solid ${S.errBd}`, borderRadius:10, padding:20, textAlign:'center' }}>
                <div style={{ fontSize:24, marginBottom:10 }}>🎯</div>
                <div style={{ fontSize:14, fontWeight:700, color:S.err, marginBottom:8 }}>No Active Goals Found</div>
                <div style={{ fontSize:13, color:S.err, lineHeight:1.7, marginBottom:16 }}>
                  You don't have any approved active goals today. You <strong>must have an active goal</strong> before you can submit an activity.
                  <br /><br />
                  Goals must be written between <strong>5:00 AM – 12:00 PM</strong> Nigeria time and approved by your leader.
                </div>
                <Link href="/goals/create" style={{
                  display:'inline-block', padding:'9px 20px', borderRadius:8, background:S.navy,
                  color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none',
                }}>
                  🎯 Create a Goal Now
                </Link>
              </div>
            ) : (
              <div>
                {label('Select your goal', true)}
                <select value={goalId} onChange={e => setGoalId(e.target.value)}
                  style={{ ...inp, border: goalId ? `1px solid ${S.ok}` : `2px solid ${S.err}` }}>
                  <option value="">— Select the goal this activity fulfils —</option>
                  {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
                {!goalId && (
                  <div style={{ fontSize:12, color:S.err, marginTop:6 }}>⚠ You must select a goal to proceed.</div>
                )}
                {goalId && (
                  <div style={{ marginTop:10, padding:'10px 14px', background:S.okBg, border:`1px solid ${S.okBd}`, borderRadius:8, fontSize:12, color:S.ok }}>
                    ✅ Goal linked. Submitting this activity will mark your goal as <strong>completed</strong>.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Proof */}
        {step === 2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <p style={{ fontSize:13, color:S.tx2, lineHeight:1.7, margin:0 }}>
              Attach proof of your activity — upload an image or paste a link.
            </p>
            <div style={{ display:'flex', gap:0, background:S.s3, borderRadius:8, padding:3 }}>
              {(['upload', 'link'] as const).map(m => (
                <button key={m} type="button" onClick={() => { setProofMode(m); setError('') }}
                  style={{
                    flex:1, padding:'7px 0', borderRadius:6, border:'none', cursor:'pointer',
                    fontSize:13, fontWeight:600,
                    background: proofMode === m ? S.navy : 'transparent',
                    color:      proofMode === m ? '#fff' : S.tx2,
                  }}>
                  {m === 'upload' ? '📸 Upload Image' : '🔗 Paste Link'}
                </button>
              ))}
            </div>
            {proofMode === 'upload' ? (
              <div>
                {label('Image File', proofRequired)}
                <label style={{
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  gap:8, padding:'24px 16px', borderRadius:8, border:`2px dashed ${proofFile ? S.ok : S.bd}`,
                  background: proofFile ? S.okBg : S.s2, cursor:'pointer',
                }}>
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display:'none' }} />
                  {proofFile ? (
                    <>
                      <span style={{ fontSize:28 }}>✅</span>
                      <span style={{ fontSize:13, fontWeight:600, color:S.ok }}>{proofFile.name}</span>
                      <span style={{ fontSize:11, color:S.mu }}>Click to change</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize:28 }}>📸</span>
                      <span style={{ fontSize:13, color:S.tx2 }}>Click to choose an image</span>
                      <span style={{ fontSize:11, color:S.mu }}>JPG, PNG, GIF — max 10MB</span>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <div>
                {label('Proof URL', proofRequired)}
                <input value={proofUrl} onChange={e => setProofUrl(e.target.value)}
                  placeholder="https://drive.google.com/… or screenshot link" style={inp} />
                <div style={{ fontSize:11, color:S.mu, marginTop:5 }}>
                  Paste a Google Drive link, photo URL, or any hosted file link
                </div>
                {proofUrl && (
                  <div style={{ marginTop:10 }}>
                    {label('Proof type')}
                    <select value={proofType} onChange={e => setProofType(e.target.value)} style={inp}>
                      <option value="image">Image / Screenshot</option>
                      <option value="video_link">Video Link</option>
                      <option value="document">Document</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Confirm */}
        {step === 3 && (
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:S.gold, marginBottom:16, textTransform:'uppercase', letterSpacing:'0.06em' }}>
              Review before submitting
            </div>
            {[
              { label:'Title',       value: title },
              { label:'Type',        value: actType },
              { label:'Date',        value: new Date(actDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) },
              { label:'Notes',       value: description || '—' },
              { label:'Linked Goal', value: goals.find(g => g.id === goalId)?.title || '—' },
              { label:'Proof',       value: proofMode === 'upload' ? (proofFile?.name ?? 'None') : (proofUrl || 'None') },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', gap:16, padding:'10px 0', borderBottom:`1px solid ${S.bd}` }}>
                <span style={{ fontSize:11, fontWeight:600, color:S.mu, textTransform:'uppercase', letterSpacing:'0.05em', width:90, flexShrink:0, paddingTop:1 }}>
                  {row.label}
                </span>
                <span style={{ fontSize:13, color:S.tx, lineHeight:1.5 }}>{row.value}</span>
              </div>
            ))}
            <div style={{ marginTop:16, padding:'12px 14px', background:S.okBg, border:`1px solid ${S.okBd}`, borderRadius:8, fontSize:12, color:S.ok }}>
              ✅ Submitting will mark your goal <strong>"{goals.find(g => g.id === goalId)?.title}"</strong> as completed.
            </div>
            <div style={{ marginTop:8, padding:'12px 14px', background:S.blueBg, border:`1px solid ${S.blueBd}`, borderRadius:8, fontSize:12, color:S.blue }}>
              ℹ Once submitted, you have <strong>24 hours</strong> to edit this activity before it locks for review.
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <button onClick={() => step === 0 ? router.push('/activities') : setStep(s => s - 1)}
          style={{ padding:'10px 20px', borderRadius:8, background:'transparent', border:`1px solid ${S.bd}`, color:S.tx2, fontSize:13, fontWeight:600, cursor:'pointer' }}>
          {step === 0 ? 'Cancel' : '← Back'}
        </button>

        {step < STEPS.length - 1 ? (
          // On step 1 with no goals, disable Next
          <button
            onClick={() => { if (step === 1 && goals.length === 0) return; setStep(s => s + 1) }}
            disabled={!canNext() || (step === 1 && goals.length === 0)}
            style={{ padding:'10px 24px', borderRadius:8, background: (canNext() && !(step === 1 && goals.length === 0)) ? S.navy : S.s3, color: (canNext() && !(step === 1 && goals.length === 0)) ? '#fff' : S.mu, fontSize:13, fontWeight:700, border:'none', cursor: (canNext() && !(step === 1 && goals.length === 0)) ? 'pointer' : 'not-allowed' }}>
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading || uploading}
            style={{ padding:'10px 24px', borderRadius:8, background: (loading || uploading) ? S.mu : S.ok, color:'#fff', fontSize:13, fontWeight:700, border:'none', cursor: (loading || uploading) ? 'not-allowed' : 'pointer' }}>
            {uploading ? 'Uploading…' : loading ? 'Submitting…' : '✓ Submit Activity'}
          </button>
        )}
      </div>
    </div>
  )
}
