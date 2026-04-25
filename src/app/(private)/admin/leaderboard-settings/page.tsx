'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'

type Weights = {
  verified_weight: number
  unverified_weight: number
  rejected_weight: number
  updated_at?: string
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1f2937', border: '1px solid #374151',
  borderRadius: 8, padding: '10px 12px', fontSize: 16, fontWeight: 700,
  color: '#e2e8f0', outline: 'none', boxSizing: 'border-box', textAlign: 'center',
}

export default function AdminLeaderboardSettingsPage() {
  const [weights, setWeights] = useState<Weights>({ verified_weight: 1.0, unverified_weight: 0.2, rejected_weight: 0.0 })
  const [draft, setDraft] = useState<Weights | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/leaderboard/weights')
      .then(r => r.json())
      .then(d => {
        const w = {
          verified_weight: d.verified_weight ?? d.verified ?? 1.0,
          unverified_weight: d.unverified_weight ?? d.unverified ?? 0.2,
          rejected_weight: d.rejected_weight ?? d.rejected ?? 0.0,
          updated_at: d.updated_at,
        }
        setWeights(w)
        setLoading(false)
      })
  }, [])

  const current = draft ?? weights
  const isEditing = draft !== null

  function startEdit() { setDraft({ ...weights }); setSaved(false) }
  function cancelEdit() { setDraft(null) }

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    const res = await fetch('/api/leaderboard/weights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verified_weight: Number(draft.verified_weight),
        unverified_weight: Number(draft.unverified_weight),
        rejected_weight: Number(draft.rejected_weight),
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setWeights(data)
      setDraft(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const scoreCards = [
    { label: 'Verified Activity', key: 'verified_weight' as keyof Weights, color: '#10b981', description: 'Points awarded for each verified submission' },
    { label: 'Unverified Activity', key: 'unverified_weight' as keyof Weights, color: '#f59e0b', description: 'Partial credit before verification (0–1)' },
    { label: 'Rejected Activity', key: 'rejected_weight' as keyof Weights, color: '#ef4444', description: 'Points for rejected submissions (usually 0)' },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <PageHeader title="Leaderboard Settings" subtitle="Configure how activity points are weighted for scoring" />
        {!loading && (
          isEditing ? (
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={cancelEdit} style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 13,
                background: 'transparent', border: '1px solid #374151', color: '#6b7280', cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer',
                opacity: saving ? 0.7 : 1,
              }}>{saving ? 'Saving…' : 'Save Weights'}</button>
            </div>
          ) : (
            <button onClick={startEdit} style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, flexShrink: 0,
              background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', cursor: 'pointer',
            }}>Edit Weights</button>
          )
        )}
      </div>

      {saved && (
        <div style={{
          marginBottom: 16, padding: '10px 16px', borderRadius: 8,
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          fontSize: 13, color: '#10b981',
        }}>✓ Weights updated successfully. New scores will apply to the next leaderboard snapshot.</div>
      )}

      {loading ? (
        <div style={{ color: '#4b5563', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading…</div>
      ) : (
        <>
          {/* Weight cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {scoreCards.map(({ label, key, color, description }) => (
              <div key={key} style={{
                background: '#111827', border: `1px solid ${isEditing ? '#374151' : '#1f2937'}`,
                borderRadius: 14, padding: 20, borderTop: `3px solid ${color}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                  {label}
                </div>
                {isEditing ? (
                  <input
                    type="number" min="0" max="10" step="0.1"
                    style={{ ...inputStyle, color }}
                    value={draft![key] as number}
                    onChange={e => setDraft(prev => prev ? { ...prev, [key]: e.target.value } : prev)}
                  />
                ) : (
                  <div style={{ fontSize: 36, fontWeight: 800, color, textAlign: 'center' }}>
                    {Number(current[key]).toFixed(1)}
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#4b5563', marginTop: 8, textAlign: 'center', lineHeight: 1.4 }}>
                  {description}
                </div>
              </div>
            ))}
          </div>

          {/* Score preview */}
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>Score Formula Preview</div>
            <div style={{
              fontFamily: 'monospace', fontSize: 13, color: '#a78bfa',
              background: '#0f172a', borderRadius: 8, padding: '12px 16px', lineHeight: 1.8,
            }}>
              score = (verified × <span style={{ color: '#10b981' }}>{Number(current.verified_weight).toFixed(1)}</span>)
              {' '}+ (unverified × <span style={{ color: '#f59e0b' }}>{Number(current.unverified_weight).toFixed(1)}</span>)
              {' '}+ (rejected × <span style={{ color: '#ef4444' }}>{Number(current.rejected_weight).toFixed(1)}</span>)
            </div>
            <div style={{ fontSize: 12, color: '#4b5563', marginTop: 10 }}>
              Example: 10 verified + 3 unverified + 1 rejected ={' '}
              <strong style={{ color: '#a78bfa' }}>
                {(10 * Number(current.verified_weight) + 3 * Number(current.unverified_weight) + 1 * Number(current.rejected_weight)).toFixed(1)} pts
              </strong>
            </div>
            {current.updated_at && (
              <div style={{ fontSize: 11, color: '#374151', marginTop: 8 }}>
                Last updated: {new Date(current.updated_at).toLocaleString()}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
