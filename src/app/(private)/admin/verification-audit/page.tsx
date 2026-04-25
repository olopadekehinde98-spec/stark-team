'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'

type Record = {
  id: string
  action: 'verified' | 'rejected' | 'unverified'
  rejection_reason: string | null
  notes: string | null
  created_at: string
  verifier: { full_name: string; rank: string } | null
  activity: { title: string; activity_type: string } | null
}

const ACTION_COLOR: Record<string, string> = {
  verified: '#10b981', rejected: '#ef4444', unverified: '#f59e0b',
}

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

export default function AdminVerificationAuditPage() {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/verification/audit')
      .then(r => r.json())
      .then(d => { setRecords(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const filtered = filter === 'all' ? records : records.filter(r => r.action === filter)

  const counts = {
    all: records.length,
    verified: records.filter(r => r.action === 'verified').length,
    rejected: records.filter(r => r.action === 'rejected').length,
    unverified: records.filter(r => r.action === 'unverified').length,
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <PageHeader title="Verification Audit" subtitle="Full log of all verification actions" />

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['all', 'verified', 'rejected', 'unverified'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', border: '1px solid',
            background: filter === f ? (f === 'all' ? '#6366f1' : ACTION_COLOR[f] ?? '#6366f1') : 'transparent',
            color: filter === f ? '#fff' : (f === 'all' ? '#6b7280' : ACTION_COLOR[f] ?? '#6b7280'),
            borderColor: f === 'all' ? '#374151' : ACTION_COLOR[f] ?? '#374151',
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#4b5563', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>No records found.</div>
        </div>
      ) : (
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1f2937' }}>
                {['Action', 'Activity', 'Verifier', 'Reason / Notes', 'When'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 600, color: '#6b7280',
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1f2937' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                      background: `${ACTION_COLOR[r.action]}18`,
                      color: ACTION_COLOR[r.action],
                      border: `1px solid ${ACTION_COLOR[r.action]}30`,
                    }}>{r.action}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{r.activity?.title ?? '—'}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{r.activity?.activity_type ?? ''}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#e2e8f0' }}>{r.verifier?.full_name ?? '—'}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, textTransform: 'capitalize' }}>
                      {r.verifier?.rank?.replace(/_/g, ' ') ?? ''}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#9ca3af', maxWidth: 260 }}>
                    {r.rejection_reason || r.notes || <span style={{ color: '#4b5563' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {timeAgo(r.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
