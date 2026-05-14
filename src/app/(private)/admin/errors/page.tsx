'use client'
import { useEffect, useState, useCallback } from 'react'

const S = {
  navy: '#0F1C2E', gold: '#D4A017',
  bg: '#F0F4F8', s1: '#FFFFFF', bd: '#E2E8F0',
  tx: '#0F172A', tx2: '#475569', mu: '#94A3B8',
  err: '#DC2626', errBg: '#FEF2F2', errBd: '#FCA5A5',
}

type ErrorEntry = {
  id: string
  created_at: string
  type: string
  message: string
  page: string
  stack?: string
  user: string
  userAgent?: string
}

type GroupedError = {
  message: string
  type: string
  count: number
  latest: string
  pages: string[]
  users: string[]
  stack?: string
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function groupErrors(errors: ErrorEntry[]): GroupedError[] {
  const map = new Map<string, GroupedError>()
  for (const e of errors) {
    const key = e.message ?? '(no message)'
    const existing = map.get(key)
    if (existing) {
      existing.count++
      if (!existing.pages.includes(e.page)) existing.pages.push(e.page)
      if (!existing.users.includes(e.user)) existing.users.push(e.user)
      if (e.created_at > existing.latest) existing.latest = e.created_at
    } else {
      map.set(key, {
        message: key,
        type: e.type,
        count: 1,
        latest: e.created_at,
        pages: [e.page].filter(Boolean),
        users: [e.user].filter(Boolean),
        stack: e.stack,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.latest.localeCompare(a.latest))
}

export default function AdminErrorsPage() {
  const [errors,    setErrors]    = useState<ErrorEntry[]>([])
  const [loading,   setLoading]   = useState(true)
  const [clearing,  setClearing]  = useState(false)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [fetchErr,  setFetchErr]  = useState('')

  const since24h = Date.now() - 24 * 60 * 60 * 1000
  const count24h = errors.filter(e => new Date(e.created_at).getTime() > since24h).length

  const load = useCallback(async () => {
    setLoading(true)
    setFetchErr('')
    try {
      const res = await fetch('/api/admin/errors')
      const json = await res.json()
      if (!res.ok) { setFetchErr(json.error ?? 'Failed to load'); return }
      setErrors(json.errors ?? [])
    } catch {
      setFetchErr('Cannot reach the server')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleClearAll() {
    if (!confirm('Delete all client error logs? This cannot be undone.')) return
    setClearing(true)
    try {
      const res = await fetch('/api/admin/errors', { method: 'DELETE' })
      if (res.ok) { setErrors([]) }
    } catch { /* ignore */ } finally {
      setClearing(false)
    }
  }

  const grouped = groupErrors(errors)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: S.tx, letterSpacing: '-0.03em', marginBottom: 4 }}>
            Error Log
            {count24h > 0 && (
              <span style={{
                marginLeft: 10, padding: '2px 10px', borderRadius: 20, fontSize: 13,
                background: S.errBg, color: S.err, border: `1px solid ${S.errBd}`, fontWeight: 700,
              }}>{count24h} in last 24h</span>
            )}
          </h1>
          <p style={{ fontSize: 13, color: S.tx2 }}>
            Client-side JavaScript errors captured from users — last 7 days, up to 200 entries.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} disabled={loading} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: S.s1, color: S.tx2, border: `1px solid ${S.bd}`,
            cursor: loading ? 'wait' : 'pointer',
          }}>
            {loading ? '…' : '↻ Refresh'}
          </button>
          <button onClick={handleClearAll} disabled={clearing || errors.length === 0} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: S.errBg, color: S.err, border: `1px solid ${S.errBd}`,
            cursor: (clearing || errors.length === 0) ? 'not-allowed' : 'pointer',
            opacity: errors.length === 0 ? 0.5 : 1,
          }}>
            {clearing ? 'Clearing…' : '🗑 Clear all'}
          </button>
        </div>
      </div>

      {fetchErr && (
        <div style={{ background: S.errBg, border: `1px solid ${S.errBd}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: S.err, marginBottom: 16 }}>
          {fetchErr}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: `3px solid ${S.bd}`, borderTop: `3px solid ${S.navy}`, animation: 'spin .8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : grouped.length === 0 ? (
        <div style={{ background: S.s1, border: `1px solid ${S.bd}`, borderRadius: 14, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: S.tx, marginBottom: 6 }}>No errors recorded</div>
          <div style={{ fontSize: 13, color: S.tx2 }}>Client errors from the last 7 days will appear here.</div>
        </div>
      ) : (
        <div style={{ background: S.s1, border: `1px solid ${S.bd}`, borderRadius: 14, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '140px 80px 80px 1fr 120px',
            background: S.navy, padding: '10px 16px', gap: 12,
          }}>
            {['Time', 'Type', 'Count', 'Message', 'Users'].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>

          {grouped.map((g, i) => {
            const isExpanded = expanded === g.message
            const isLast = i === grouped.length - 1
            return (
              <div key={g.message + i}>
                <div
                  onClick={() => setExpanded(isExpanded ? null : g.message)}
                  style={{
                    display: 'grid', gridTemplateColumns: '140px 80px 80px 1fr 120px',
                    padding: '12px 16px', gap: 12, cursor: 'pointer', alignItems: 'start',
                    borderBottom: isLast && !isExpanded ? 'none' : `1px solid ${S.bd}`,
                    background: isExpanded ? '#F8FAFC' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{ fontSize: 12, color: S.tx2 }}>{fmt(g.latest)}</div>
                  <div>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: g.type === 'js_error' ? '#FEF2F2' : '#FFF7ED',
                      color: g.type === 'js_error' ? S.err : '#D97706',
                    }}>{g.type === 'js_error' ? 'JS' : 'Promise'}</span>
                  </div>
                  <div>
                    {g.count > 1 ? (
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: 'rgba(15,28,46,0.08)', color: S.navy,
                      }}>{g.count}×</span>
                    ) : (
                      <span style={{ fontSize: 12, color: S.mu }}>1</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: S.tx, fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.4 }}>
                    {g.message.length > 120 ? g.message.slice(0, 120) + '…' : g.message}
                  </div>
                  <div style={{ fontSize: 12, color: S.tx2 }}>
                    {g.users.slice(0, 2).join(', ')}{g.users.length > 2 ? ` +${g.users.length - 2}` : ''}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{
                    padding: '0 16px 16px', borderBottom: isLast ? 'none' : `1px solid ${S.bd}`,
                    background: '#F8FAFC',
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: S.mu, textTransform: 'uppercase', marginBottom: 4 }}>Pages</div>
                        {g.pages.map(p => (
                          <div key={p} style={{ fontSize: 12, color: S.tx2, fontFamily: 'monospace' }}>{p || '(unknown)'}</div>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: S.mu, textTransform: 'uppercase', marginBottom: 4 }}>All Users ({g.users.length})</div>
                        {g.users.map(u => (
                          <div key={u} style={{ fontSize: 12, color: S.tx2 }}>{u}</div>
                        ))}
                      </div>
                    </div>
                    {g.stack && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: S.mu, textTransform: 'uppercase', marginBottom: 6 }}>Stack trace</div>
                        <pre style={{
                          fontSize: 11, background: '#1e1e2e', color: '#e2e8f0',
                          padding: '12px 14px', borderRadius: 8, overflowX: 'auto',
                          whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, lineHeight: 1.5,
                        }}>{g.stack}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
