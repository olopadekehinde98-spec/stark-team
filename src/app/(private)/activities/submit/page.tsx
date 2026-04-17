'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STEPS = [
  { key: 'DETAILS',     label: 'DETAILS'    },
  { key: 'LINK GOAL',   label: 'LINK GOAL'  },
  { key: 'PROOF',       label: 'UPLOAD PROOF' },
  { key: 'CONFIRM',     label: 'CONFIRM'    },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 14,
  fontFamily: 'Barlow Condensed, sans-serif',
  background: 'var(--s2)', border: '1px solid var(--b2)',
  color: 'var(--text-primary)', outline: 'none',
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono" style={{
      display: 'block', marginBottom: 6,
      fontSize: 9, letterSpacing: '0.20em', textTransform: 'uppercase',
      color: 'var(--text-muted)',
    }}>{children}</div>
  )
}

export default function SubmitActivityPage() {
  const router = useRouter()
  const [step, setStep]             = useState(0)
  const [templates, setTemplates]   = useState<any[]>([])
  const [goals, setGoals]           = useState<any[]>([])
  const [title, setTitle]           = useState('')
  const [activityType, setType]     = useState('')
  const [templateId, setTemplateId] = useState('')
  const [activityDate, setDate]     = useState(new Date().toISOString().split('T')[0])
  const [description, setDesc]      = useState('')
  const [goalId, setGoalId]         = useState('')
  const [proofUrl, setProofUrl]     = useState('')
  const [proofType, setProofType]   = useState('image')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('activity_templates').select('id,name,proof_required').eq('is_active', true).then(({ data }) => {
      setTemplates(data ?? [])
    })
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('goals').select('id,title').eq('user_id', user.id).eq('status', 'active')
      setGoals(data ?? [])
    })
  }, [])

  const selectedTemplate = templates.find(t => t.id === templateId)
  const proofRequired    = selectedTemplate?.proof_required ?? false

  function canProceed() {
    if (step === 0) return !!title.trim() && !!activityType.trim() && !!activityDate
    if (step === 2) return !proofRequired || !!proofUrl.trim()
    return true
  }

  async function handleSubmit() {
    setError('')
    if (proofRequired && !proofUrl) { setError('PROOF REQUIRED FOR THIS ACTIVITY TYPE'); return }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('NOT AUTHENTICATED'); setLoading(false); return }
    const { error: err } = await supabase.from('activities').insert({
      user_id: user.id, title,
      description: description || null,
      activity_type: activityType || selectedTemplate?.name || title,
      template_id: templateId || null,
      goal_id: goalId || null,
      activity_date: activityDate,
      proof_url: proofUrl || null,
      proof_type: proofUrl ? proofType : 'none',
    })
    setLoading(false)
    if (err) { setError(err.message.toUpperCase()); return }
    router.push('/activities')
  }

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>

      {/* ── HEADER ───────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
          fontSize: 22, textTransform: 'uppercase', letterSpacing: '0.10em',
          color: 'var(--text-primary)',
        }}>SUBMIT FIELD REPORT</h1>
        <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', marginTop: 2 }}>
          RECORD ACTIVITY FOR VERIFICATION
        </div>
      </div>

      {/* ── STEP INDICATOR ───────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i < step ? 'var(--gold)' : i === step ? 'var(--gold-dim)' : 'var(--s2)',
                border: `1px solid ${i <= step ? 'var(--gold)' : 'var(--b2)'}`,
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: 10, color: i < step ? '#03060A' : i === step ? 'var(--gold)' : 'var(--text-muted)',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="font-mono" style={{
                fontSize: 8, letterSpacing: '0.15em',
                color: i === step ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 1, marginLeft: 8,
                background: i < step ? 'var(--gold)' : 'var(--b1)',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* ── STEP CONTENT ─────────────────────────── */}
      <div className="panel panel-bracket" style={{ padding: 24, marginBottom: 16 }}>

        {error && (
          <div className="font-mono" style={{
            padding: '10px 14px', marginBottom: 16,
            background: 'rgba(232,48,64,0.08)', border: '1px solid rgba(232,48,64,0.25)',
            color: 'var(--danger)', fontSize: 9, letterSpacing: '0.08em',
          }}>
            [!] {error}
          </div>
        )}

        {/* STEP 0: Details */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <FieldLabel>ACTIVITY TEMPLATE (OPTIONAL)</FieldLabel>
              <select value={templateId} onChange={e => {
                setTemplateId(e.target.value)
                const t = templates.find(t => t.id === e.target.value)
                if (t) setType(t.name)
              }} style={inputStyle}>
                <option value="">NO TEMPLATE</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name.toUpperCase()}{t.proof_required ? ' [PROOF REQUIRED]' : ''}</option>
                ))}
              </select>
            </div>

            {proofRequired && (
              <div style={{
                padding: '10px 14px', background: 'rgba(232,48,64,0.08)',
                border: '1px solid rgba(232,48,64,0.25)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--danger)' }}>[!]</span>
                <span className="font-mono" style={{ fontSize: 9, color: 'var(--danger)', letterSpacing: '0.08em' }}>
                  PROOF UPLOAD REQUIRED FOR THIS ACTIVITY TYPE
                </span>
              </div>
            )}

            <div>
              <FieldLabel>TITLE *</FieldLabel>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Activity title..." style={inputStyle} />
            </div>
            <div>
              <FieldLabel>ACTIVITY TYPE *</FieldLabel>
              <input value={activityType} onChange={e => setType(e.target.value)}
                placeholder="e.g. SALES CALL" style={inputStyle} />
            </div>
            <div>
              <FieldLabel>ACTIVITY DATE *</FieldLabel>
              <input type="date" value={activityDate} onChange={e => setDate(e.target.value)}
                style={inputStyle} />
            </div>
            <div>
              <FieldLabel>NOTES / DESCRIPTION</FieldLabel>
              <textarea value={description} onChange={e => setDesc(e.target.value)}
                placeholder="Brief operational notes..." rows={3}
                style={{ ...inputStyle, resize: 'none' }} />
            </div>
          </div>
        )}

        {/* STEP 1: Link Goal */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13,
              color: 'var(--text-secondary)', lineHeight: 1.6,
            }}>
              Link this activity to an active objective to track mission progress.
            </div>
            {goals.length === 0 ? (
              <div className="panel" style={{ padding: '20px', textAlign: 'center' }}>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
                  NO ACTIVE OBJECTIVES — SKIP THIS STEP
                </div>
              </div>
            ) : (
              <div>
                <FieldLabel>LINK TO OBJECTIVE</FieldLabel>
                <select value={goalId} onChange={e => setGoalId(e.target.value)} style={inputStyle}>
                  <option value="">NO OBJECTIVE</option>
                  {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Proof */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <FieldLabel>PROOF URL {proofRequired && <span style={{ color: 'var(--danger)' }}>*</span>}</FieldLabel>
              <input value={proofUrl} onChange={e => setProofUrl(e.target.value)}
                placeholder="https://..." style={inputStyle} />
              <div className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.1em' }}>
                LINK TO SCREENSHOT, VIDEO, OR DOCUMENT
              </div>
            </div>
            {proofUrl && (
              <div>
                <FieldLabel>PROOF TYPE</FieldLabel>
                <select value={proofType} onChange={e => setProofType(e.target.value)} style={inputStyle}>
                  <option value="image">IMAGE / SCREENSHOT</option>
                  <option value="video_link">VIDEO LINK</option>
                  <option value="document">DOCUMENT</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Confirm */}
        {step === 3 && (
          <div>
            <div className="font-mono" style={{
              fontSize: 9, letterSpacing: '0.2em', color: 'var(--gold)',
              marginBottom: 16,
            }}>MISSION BRIEF — CONFIRM BEFORE SUBMISSION</div>
            {[
              { label: 'TITLE',         value: title },
              { label: 'TYPE',          value: activityType },
              { label: 'DATE',          value: activityDate },
              { label: 'NOTES',         value: description || '—' },
              { label: 'OBJECTIVE',     value: goals.find(g => g.id === goalId)?.title || '—' },
              { label: 'PROOF',         value: proofUrl || '—' },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', gap: 16, padding: '10px 0',
                borderBottom: '1px solid var(--b1)',
              }}>
                <span className="font-mono" style={{
                  fontSize: 8, color: 'var(--text-muted)',
                  letterSpacing: '0.15em', width: 80, flexShrink: 0, paddingTop: 2,
                }}>{row.label}</span>
                <span style={{
                  fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13,
                  color: 'var(--text-primary)',
                }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── NAV BUTTONS ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => step === 0 ? router.push('/activities') : setStep(s => s - 1)}
          style={{
            padding: '10px 20px',
            background: 'transparent', border: '1px solid var(--b2)',
            color: 'var(--text-muted)',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
            fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}>
          {step === 0 ? 'CANCEL' : '← BACK'}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            style={{
              padding: '10px 24px',
              background: canProceed() ? 'var(--gold)' : 'var(--s2)',
              border: 'none', color: canProceed() ? '#03060A' : 'var(--text-muted)',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: canProceed() ? 'pointer' : 'not-allowed',
            }}>
            NEXT →
          </button>
        ) : (
          <button
            onClick={handleSubmit} disabled={loading}
            style={{
              padding: '10px 24px',
              background: loading ? 'var(--s2)' : 'var(--gold)',
              border: 'none', color: loading ? 'var(--text-muted)' : '#03060A',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {loading ? 'TRANSMITTING...' : 'SUBMIT REPORT ✓'}
          </button>
        )}
      </div>
    </div>
  )
}
