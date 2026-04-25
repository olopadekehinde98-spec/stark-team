'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'

type Criteria = {
  id: string
  rank: string
  min_verified_activities: number
  min_verified_rate_pct: number
  min_days_at_current_rank: number
  min_team_size: number
  updated_at: string
}

const RANK_LABELS: Record<string, string> = {
  manager: 'Manager',
  senior_manager: 'Senior Manager',
  executive_manager: 'Executive Manager',
  director: 'Director',
}

const RANK_COLORS: Record<string, string> = {
  manager: '#6366f1',
  senior_manager: '#8b5cf6',
  executive_manager: '#f59e0b',
  director: '#10b981',
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1f2937', border: '1px solid #374151',
  borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e2e8f0',
  outline: 'none', boxSizing: 'border-box',
}

export default function AdminRankCriteriaPage() {
  const [criteria, setCriteria] = useState<Criteria[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Criteria | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/ranks')
      .then(r => r.json())
      .then(d => { setCriteria(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  function startEdit(c: Criteria) {
    setEditing({ ...c })
    setSaved(null)
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    const res = await fetch('/api/admin/ranks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rank: editing.rank,
        min_verified_activities: Number(editing.min_verified_activities),
        min_verified_rate_pct: Number(editing.min_verified_rate_pct),
        min_days_at_current_rank: Number(editing.min_days_at_current_rank),
        min_team_size: Number(editing.min_team_size),
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setCriteria(prev => prev.map(c => c.rank === data.rank ? data : c))
      setEditing(null)
      setSaved(data.rank)
      setTimeout(() => setSaved(null), 2000)
    }
  }

  const field = (label: string, key: keyof Criteria, unit = '') => (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type="number" min="0"
          style={inputStyle}
          value={editing![key] as number}
          onChange={e => setEditing(prev => prev ? { ...prev, [key]: e.target.value } : prev)}
        />
        {unit && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#6b7280' }}>{unit}</span>}
      </div>
    </div>
  )

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <PageHeader title="Rank Criteria" subtitle="Configure the promotion requirements for each rank" />

      {loading ? (
        <div style={{ color: '#4b5563', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {criteria.map(c => {
            const color = RANK_COLORS[c.rank] ?? '#6366f1'
            const isEditing = editing?.rank === c.rank
            return (
              <div key={c.rank} style={{
                background: '#111827',
                border: `1px solid ${isEditing ? color + '55' : '#1f2937'}`,
                borderRadius: 14, overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', borderBottom: '1px solid #1f2937',
                  borderLeft: `3px solid ${color}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
                      {RANK_LABELS[c.rank] ?? c.rank}
                    </span>
                    {saved === c.rank && (
                      <span style={{ fontSize: 12, color: '#10b981' }}>✓ Saved</span>
                    )}
                  </div>
                  {!isEditing ? (
                    <button onClick={() => startEdit(c)} style={{
                      padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                      background: '#1f2937', border: '1px solid #374151', color: '#9ca3af', cursor: 'pointer',
                    }}>Edit</button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setEditing(null)} style={{
                        padding: '6px 12px', borderRadius: 7, fontSize: 12,
                        background: 'transparent', border: '1px solid #374151', color: '#6b7280', cursor: 'pointer',
                      }}>Cancel</button>
                      <button onClick={handleSave} disabled={saving} style={{
                        padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                        background: color, border: 'none', color: '#fff', cursor: 'pointer',
                        opacity: saving ? 0.7 : 1,
                      }}>{saving ? 'Saving…' : 'Save'}</button>
                    </div>
                  )}
                </div>

                {/* Fields */}
                <div style={{ padding: 20 }}>
                  {isEditing ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                      {field('Min Verified Activities', 'min_verified_activities')}
                      {field('Min Verified Rate', 'min_verified_rate_pct', '%')}
                      {field('Min Days at Rank', 'min_days_at_current_rank', 'days')}
                      {field('Min Team Size', 'min_team_size', 'members')}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                      {[
                        { label: 'Min Activities', value: c.min_verified_activities },
                        { label: 'Min Rate', value: `${c.min_verified_rate_pct}%` },
                        { label: 'Min Days', value: `${c.min_days_at_current_rank}d` },
                        { label: 'Min Team', value: c.min_team_size },
                      ].map(s => (
                        <div key={s.label} style={{ background: '#1f2937', borderRadius: 8, padding: '12px 14px' }}>
                          <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{s.label}</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
