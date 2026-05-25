/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  warn:'#D97706', warnBg:'#FFFBEB', warnBd:'#FCD34D',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
  blue:'#2563EB', blueBg:'#EFF6FF', blueBd:'#BFDBFE',
}

const ACTION_MAP: Record<string, { label: string; bg: string; color: string; bd: string; icon: string }> = {
  verified:   { label:'Verified',    bg:S.okBg,   color:S.ok,   bd:S.okBd,   icon:'✓' },
  rejected:   { label:'Rejected',    bg:S.errBg,  color:S.err,  bd:S.errBd,  icon:'✕' },
  unverified: { label:'Unverified',  bg:S.warnBg, color:S.warn, bd:S.warnBd, icon:'~' },
}

function badge(action: string) {
  const a = ACTION_MAP[action] ?? { label: action, bg: S.s3, color: S.tx2, bd: S.bd, icon: '?' }
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
      background: a.bg, color: a.color, border: `1px solid ${a.bd}`,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {a.icon} {a.label}
    </span>
  )
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function VerificationAuditPage() {
  const [records, setRecords]   = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')

  useEffect(() => {
    fetch('/api/verification/audit')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) { setRecords(d); setFiltered(d) }
        else setError(d.error ?? 'Failed to load')
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let list = records
    if (filter !== 'all') list = list.filter(r => r.action === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.activity?.title?.toLowerCase().includes(q) ||
        r.activity?.activity_type?.toLowerCase().includes(q) ||
        r.verifier?.full_name?.toLowerCase().includes(q)
      )
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFiltered(list)
  }, [search, filter, records])

  const counts = {
    all:        records.length,
    verified:   records.filter(r => r.action === 'verified').length,
    rejected:   records.filter(r => r.action === 'rejected').length,
    unverified: records.filter(r => r.action === 'unverified').length,
  }

  return (
    <div>
      <style>{`@media(max-width:640px){.audit-table thead{display:none}.audit-table tr{display:block;margin-bottom:12px;border:1px solid ${S.bd};border-radius:8px;padding:12px}.audit-table td{display:flex;justify-content:space-between;padding:4px 0;border:none;font-size:12px}.audit-table td::before{content:attr(data-label);font-weight:600;color:${S.mu};font-size:11px}}`}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: S.tx, letterSpacing: '-0.03em', marginBottom: 4 }}>Verification Audit</h1>
        <p style={{ fontSize: 13, color: S.tx2 }}>Full history of all verification actions taken by leaders and admins</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Actions', value: counts.all,        color: S.navy },
          { label: 'Verified',      value: counts.verified,   color: S.ok },
          { label: 'Rejected',      value: counts.rejected,   color: S.err },
          { label: 'Unverified',    value: counts.unverified, color: S.warn },
        ].map(s => (
          <div key={s.label} style={{ background: S.s1, border: `1px solid ${S.bd}`, borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono',monospace" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: S.tx2, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search activity or verifier…"
          style={{ flex: 1, minWidth: 200, padding: '9px 13px', borderRadius: 8, border: `1px solid ${S.bd}`, background: S.s2, fontSize: 13, color: S.tx, outline: 'none' }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ padding: '9px 13px', borderRadius: 8, border: `1px solid ${S.bd}`, background: S.s2, fontSize: 13, color: S.tx, outline: 'none' }}>
          <option value="all">All actions ({counts.all})</option>
          <option value="verified">Verified ({counts.verified})</option>
          <option value="rejected">Rejected ({counts.rejected})</option>
          <option value="unverified">Unverified ({counts.unverified})</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: S.s1, border: `1px solid ${S.bd}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${S.bd}`, borderTop: `3px solid ${S.navy}`, animation: 'spin .8s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : error ? (
          <div style={{ padding: 32, textAlign: 'center', color: S.err, fontSize: 13 }}>⚠ {error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: S.mu, fontSize: 13 }}>
            {records.length === 0 ? 'No verification records yet.' : 'No results match your search.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="audit-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: S.s2, borderBottom: `1px solid ${S.bd}` }}>
                  {['Date & Time', 'Activity', 'Type', 'Action', 'Leader / Admin', 'Rejection Reason'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: S.mu, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${S.bd}` : 'none', background: i % 2 === 0 ? S.s1 : S.s2 }}>
                    <td data-label="Date" style={{ padding: '12px 16px', fontSize: 12, color: S.tx2, whiteSpace: 'nowrap' }}>
                      {fmt(r.created_at)}
                    </td>
                    <td data-label="Activity" style={{ padding: '12px 16px', fontSize: 13, color: S.tx, maxWidth: 220 }}>
                      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.activity?.title ?? '—'}
                      </div>
                    </td>
                    <td data-label="Type" style={{ padding: '12px 16px', fontSize: 12, color: S.tx2, whiteSpace: 'nowrap' }}>
                      {r.activity?.activity_type ?? '—'}
                    </td>
                    <td data-label="Action" style={{ padding: '12px 16px' }}>
                      {badge(r.action)}
                    </td>
                    <td data-label="Leader" style={{ padding: '12px 16px', fontSize: 13, color: S.tx, whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600 }}>{r.verifier?.full_name ?? '—'}</div>
                      {r.verifier?.rank && (
                        <div style={{ fontSize: 11, color: S.mu, marginTop: 1 }}>
                          {r.verifier.rank.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </div>
                      )}
                    </td>
                    <td data-label="Reason" style={{ padding: '12px 16px', fontSize: 12, color: S.err, maxWidth: 200 }}>
                      {r.rejection_reason ? (
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.rejection_reason}>
                          {r.rejection_reason}
                        </span>
                      ) : (
                        <span style={{ color: S.mu }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: S.mu, textAlign: 'right' }}>
        Showing {filtered.length} of {records.length} records (most recent first)
      </div>
    </div>
  )
}
