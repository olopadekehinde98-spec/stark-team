'use client'
import { useEffect, useState } from 'react'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
}

const WEIGHTS_INFO = [
  {
    key: 'verified_weight',
    label: 'Verified Activity',
    desc: 'Points multiplier for activities that a leader has verified',
    icon: '✓',
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
    default: 1.0,
    min: 0.1, max: 5.0, step: 0.1,
  },
  {
    key: 'unverified_weight',
    label: 'Unverified Activity',
    desc: 'Points multiplier for activities pending or not yet reviewed (max 1.0)',
    icon: '~',
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
    default: 0.2,
    min: 0.0, max: 1.0, step: 0.05,
  },
  {
    key: 'rejected_weight',
    label: 'Rejected Activity',
    desc: 'Points multiplier for activities rejected by a leader (usually 0)',
    icon: '✕',
    iconBg: '#FEF2F2',
    iconColor: '#DC2626',
    default: 0.0,
    min: 0.0, max: 1.0, step: 0.05,
  },
]

export default function LeaderboardSettingsPage() {
  const [weights, setWeights] = useState<Record<string, number>>({
    verified_weight: 1.0,
    unverified_weight: 0.2,
    rejected_weight: 0.0,
  })
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/leaderboard/weights')
      .then(r => r.json())
      .then(d => {
        if (d.verified_weight !== undefined) {
          setWeights({
            verified_weight:   Number(d.verified_weight)   ?? 1.0,
            unverified_weight: Number(d.unverified_weight) ?? 0.2,
            rejected_weight:   Number(d.rejected_weight)   ?? 0.0,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true); setMsg(null)
    const res  = await fetch('/api/leaderboard/weights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) setMsg({ text: data.error ?? 'Failed to save', ok: false })
    else         setMsg({ text: 'Weights saved! New scores will apply on next leaderboard refresh.', ok: true })
  }

  function resetDefaults() {
    setWeights({ verified_weight: 1.0, unverified_weight: 0.2, rejected_weight: 0.0 })
    setMsg(null)
  }

  // Score preview example
  const example = {
    verified:   Math.round(10 * weights.verified_weight   * 10) / 10,
    unverified: Math.round(10 * weights.unverified_weight * 10) / 10,
    rejected:   Math.round(10 * weights.rejected_weight   * 10) / 10,
  }

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: S.tx, letterSpacing: '-0.03em', marginBottom: 4 }}>Leaderboard Settings</h1>
        <p style={{ fontSize: 13, color: S.tx2 }}>Configure how activity status affects leaderboard scores</p>
      </div>

      {msg && (
        <div style={{
          padding: '11px 16px', marginBottom: 20, borderRadius: 8, fontSize: 13,
          background: msg.ok ? S.okBg  : S.errBg,
          border:    `1px solid ${msg.ok ? S.okBd : S.errBd}`,
          color:      msg.ok ? S.ok    : S.err,
        }}>
          {msg.ok ? '✓ ' : '⚠ '}{msg.text}
        </div>
      )}

      {/* How scoring works */}
      <div style={{ background: S.goldBg, border: `1px solid ${S.goldBd}`, borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>📊 How leaderboard scoring works</div>
        <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.8 }}>
          Each member's score = <strong>(verified activities × verified weight) + (unverified activities × unverified weight) + (rejected activities × rejected weight)</strong>.
          Adjust the weights below to change how much each status contributes to the ranking.
        </div>
      </div>

      {/* Weight sliders */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${S.bd}`, borderTop: `3px solid ${S.navy}`, animation: 'spin .8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {WEIGHTS_INFO.map(w => (
            <div key={w.key} style={{ background: S.s1, border: `1px solid ${S.bd}`, borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: w.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: w.iconColor, flexShrink: 0 }}>
                  {w.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: S.tx }}>{w.label}</div>
                  <div style={{ fontSize: 12, color: S.mu, marginTop: 2 }}>{w.desc}</div>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 800, color: w.iconColor, minWidth: 48, textAlign: 'right' }}>
                  {weights[w.key].toFixed(2)}×
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: S.mu, width: 24 }}>{w.min}</span>
                <input
                  type="range"
                  min={w.min} max={w.max} step={w.step}
                  value={weights[w.key]}
                  onChange={e => setWeights(prev => ({ ...prev, [w.key]: Number(e.target.value) }))}
                  style={{ flex: 1, accentColor: w.iconColor, height: 4, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 11, color: S.mu, width: 24, textAlign: 'right' }}>{w.max}</span>
              </div>

              {/* Quick presets */}
              <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                {[0.0, 0.1, 0.2, 0.5, 1.0, 1.5, 2.0].filter(v => v >= w.min && v <= w.max).map(v => (
                  <button key={v} onClick={() => setWeights(prev => ({ ...prev, [w.key]: v }))}
                    style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: weights[w.key] === v ? w.iconColor : S.s3,
                      color:      weights[w.key] === v ? '#fff'       : S.tx2,
                      border:    `1px solid ${weights[w.key] === v ? w.iconColor : S.bd}`,
                    }}>
                    {v}×
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live preview */}
      <div style={{ background: S.s1, border: `1px solid ${S.bd}`, borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: S.tx, marginBottom: 14 }}>👁 Score Preview — if a member has 10 of each</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: '10 Verified',   value: example.verified,   color: S.ok },
            { label: '10 Unverified', value: example.unverified, color: '#D97706' },
            { label: '10 Rejected',   value: example.rejected,   color: S.err },
          ].map(p => (
            <div key={p.label} style={{ background: S.s2, borderRadius: 8, padding: '12px 14px', textAlign: 'center', border: `1px solid ${S.bd}` }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 26, fontWeight: 800, color: p.color }}>{p.value}</div>
              <div style={{ fontSize: 11, color: S.mu, marginTop: 4 }}>{p.label}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: S.mu, marginTop: 12 }}>
          Total example score (all 30 activities): <strong style={{ color: S.tx, fontFamily: "'JetBrains Mono',monospace" }}>{(example.verified + example.unverified + example.rejected).toFixed(1)} pts</strong>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleSave} disabled={saving || loading} style={{
          flex: 1, padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700,
          background: saving ? S.mu : S.navy, color: '#fff', border: 'none',
          cursor: saving ? 'not-allowed' : 'pointer',
        }}>
          {saving ? 'Saving…' : '💾 Save Weights'}
        </button>
        <button onClick={resetDefaults} style={{
          padding: '12px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: S.s3, color: S.tx2, border: `1px solid ${S.bd}`, cursor: 'pointer',
        }}>
          ↺ Reset Defaults
        </button>
      </div>
    </div>
  )
}
