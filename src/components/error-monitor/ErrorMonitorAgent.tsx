'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

interface CapturedError {
  id:       string
  type:     'runtime' | 'promise' | 'api' | 'react'
  message:  string
  stack?:   string
  url?:     string
  context?: string
  time:     Date
  analysis: string | null
  analyzing: boolean
}

const S = {
  navy:   '#0F1C2E',
  gold:   '#D4A017',
  err:    '#DC2626',
  errBg:  '#FEF2F2',
  errBd:  '#FCA5A5',
  ok:     '#16A34A',
  bg:     '#FFFFFF',
  s2:     '#F8FAFC',
  bd:     '#E2E8F0',
  tx:     '#0F172A',
  tx2:    '#475569',
  mu:     '#94A3B8',
  warn:   '#D97706',
  warnBg: '#FFFBEB',
}

async function analyzeError(err: CapturedError): Promise<string> {
  try {
    const res = await fetch('/api/error-monitor/analyze', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:    err.type,
        message: err.message,
        stack:   err.stack,
        url:     err.url,
        context: err.context,
      }),
    })
    if (!res.ok) return 'Could not reach analysis service.'
    const data = await res.json()
    return data.analysis ?? 'No analysis returned.'
  } catch {
    return 'Analysis unavailable (network error).'
  }
}

interface Props {
  role?: string | null
}

export default function ErrorMonitorAgent({ role }: Props) {
  const [errors,  setErrors]  = useState<CapturedError[]>([])
  const [open,    setOpen]    = useState(false)
  const [pulse,   setPulse]   = useState(false)
  const errorsRef = useRef<CapturedError[]>([])

  // Keep ref in sync so patched fetch closure sees current list
  useEffect(() => { errorsRef.current = errors }, [errors])

  const addError = useCallback((partial: Omit<CapturedError, 'id' | 'time' | 'analysis' | 'analyzing'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    // Deduplicate by message within last 5 s
    const recent = errorsRef.current.some(
      e => e.message === partial.message && Date.now() - e.time.getTime() < 5000
    )
    if (recent) return

    const newErr: CapturedError = { ...partial, id, time: new Date(), analysis: null, analyzing: true }
    setErrors(prev => [newErr, ...prev].slice(0, 20))
    setPulse(true)
    setTimeout(() => setPulse(false), 2000)

    // Kick off AI analysis immediately
    analyzeError(newErr).then(analysis => {
      setErrors(prev => prev.map(e => e.id === id ? { ...e, analysis, analyzing: false } : e))
    })
  }, [])

  useEffect(() => {
    // ── 1. Runtime JS errors ──────────────────────────────────────
    const onError = (event: ErrorEvent) => {
      addError({
        type:    'runtime',
        message: event.message || 'Unknown JS error',
        stack:   event.error?.stack,
        url:     event.filename || window.location.pathname,
      })
    }

    // ── 2. Unhandled promise rejections ──────────────────────────
    const onUnhandled = (event: PromiseRejectionEvent) => {
      const msg = event.reason instanceof Error
        ? event.reason.message
        : String(event.reason ?? 'Unhandled promise rejection')
      addError({
        type:  'promise',
        message: msg,
        stack: event.reason instanceof Error ? event.reason.stack : undefined,
        url:   window.location.pathname,
      })
    }

    // ── 3. Fetch API failures (4xx / 5xx) ────────────────────────
    const origFetch = window.fetch
    window.fetch = async function patchedFetch(...args: Parameters<typeof fetch>) {
      const res = await origFetch(...args)
      if (!res.ok && res.status >= 400) {
        const reqUrl = typeof args[0] === 'string' ? args[0]
          : args[0] instanceof Request ? args[0].url
          : String(args[0])

        // Skip our own error-monitor route to avoid infinite loop
        if (!reqUrl.includes('/api/error-monitor/')) {
          addError({
            type:    'api',
            message: `API ${res.status} ${res.statusText || 'Error'}: ${reqUrl}`,
            url:     window.location.pathname,
            context: `Request to ${reqUrl}`,
          })
        }
      }
      return res
    }

    // ── 4. React render errors from ErrorBoundary ────────────────
    const onBoundaryError = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {}
      addError({
        type:    'react',
        message: detail.message ?? 'React render error',
        stack:   detail.stack,
        url:     detail.url ?? window.location.pathname,
      })
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandled)
    window.addEventListener('app-render-error', onBoundaryError)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandled)
      window.removeEventListener('app-render-error', onBoundaryError)
      window.fetch = origFetch
    }
  }, [addError])

  if (role !== 'admin' && role !== 'leader') return null

  const unresolved = errors.length
  const hasErrors  = unresolved > 0

  function clearAll() { setErrors([]) }
  function dismissOne(id: string) { setErrors(prev => prev.filter(e => e.id !== id)) }

  function typeLabel(t: CapturedError['type']) {
    return { runtime: 'JS', promise: 'Async', api: 'API', react: 'React' }[t] ?? t
  }
  function typeColor(t: CapturedError['type']) {
    return t === 'api' ? S.warn : S.err
  }

  return (
    <>
      {/* ── Floating trigger button ───────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        title="AI Error Monitor"
        style={{
          position:   'fixed',
          bottom:     80,
          right:      18,
          zIndex:     9000,
          width:      46,
          height:     46,
          borderRadius: '50%',
          background: hasErrors
            ? (pulse ? '#DC2626' : '#B91C1C')
            : S.navy,
          border: `2px solid ${hasErrors ? '#FCA5A5' : 'rgba(212,160,23,0.4)'}`,
          boxShadow: hasErrors
            ? `0 0 ${pulse ? '16px' : '8px'} rgba(220,38,38,0.5)`
            : '0 2px 8px rgba(0,0,0,0.3)',
          cursor:     'pointer',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize:   18,
          transition: 'all 0.3s',
          color:      '#fff',
        }}>
        {hasErrors ? '⚠' : '🤖'}
        {hasErrors && (
          <span style={{
            position:   'absolute',
            top:        -5,
            right:      -5,
            minWidth:   18,
            height:     18,
            borderRadius: 9,
            background: S.gold,
            border:     `2px solid ${S.navy}`,
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize:   9,
            fontWeight: 800,
            color:      S.navy,
            lineHeight: 1,
            padding:    '0 3px',
          }}>
            {unresolved > 9 ? '9+' : unresolved}
          </span>
        )}
      </button>

      {/* ── Slide-in panel ───────────────────────────────────────── */}
      {open && (
        <>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: 8998,
            background: 'rgba(0,0,0,0.2)',
          }}/>

          <div style={{
            position:     'fixed',
            bottom:       136,
            right:        14,
            zIndex:       8999,
            width:        360,
            maxWidth:     'calc(100vw - 28px)',
            maxHeight:    '60vh',
            background:   S.bg,
            border:       `1px solid ${S.bd}`,
            borderRadius: 14,
            boxShadow:    '0 8px 32px rgba(0,0,0,0.18)',
            display:      'flex',
            flexDirection: 'column',
            overflow:     'hidden',
          }}>
            {/* Panel header */}
            <div style={{
              padding:        '12px 16px',
              borderBottom:   `1px solid ${S.bd}`,
              background:     S.navy,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              flexShrink:     0,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  🤖 AI Error Monitor
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
                  {hasErrors
                    ? `${unresolved} error${unresolved !== 1 ? 's' : ''} detected`
                    : 'No errors — all clear'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {hasErrors && (
                  <button onClick={clearAll} style={{
                    padding:    '4px 10px',
                    borderRadius: 6,
                    fontSize:   11,
                    fontWeight: 600,
                    background: 'rgba(255,255,255,0.1)',
                    color:      'rgba(255,255,255,0.6)',
                    border:     '1px solid rgba(255,255,255,0.15)',
                    cursor:     'pointer',
                  }}>Clear all</button>
                )}
                <button onClick={() => setOpen(false)} style={{
                  width:      28,
                  height:     28,
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.08)',
                  border:     '1px solid rgba(255,255,255,0.12)',
                  color:      'rgba(255,255,255,0.5)',
                  cursor:     'pointer',
                  fontSize:   13,
                }}>✕</button>
              </div>
            </div>

            {/* Error list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {errors.length === 0 ? (
                <div style={{
                  padding:   40,
                  textAlign: 'center',
                  color:     S.mu,
                  fontSize:  13,
                }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
                  <div style={{ fontWeight: 600, color: S.ok }}>No errors detected</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Monitoring JS errors, async failures, and API calls.
                  </div>
                </div>
              ) : (
                errors.map((err, i) => (
                  <div key={err.id} style={{
                    padding:      '12px 14px',
                    borderBottom: i < errors.length - 1 ? `1px solid ${S.bd}` : 'none',
                    background:   i % 2 === 0 ? S.bg : S.s2,
                  }}>
                    {/* Error header row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                      <span style={{
                        fontSize:     10,
                        fontWeight:   700,
                        color:        typeColor(err.type),
                        background:   err.type === 'api' ? S.warnBg : S.errBg,
                        border:       `1px solid ${err.type === 'api' ? '#FCD34D' : S.errBd}`,
                        borderRadius: 4,
                        padding:      '1px 6px',
                        flexShrink:   0,
                        marginTop:    1,
                      }}>
                        {typeLabel(err.type)}
                      </span>
                      <span style={{
                        fontSize:   12,
                        fontWeight: 600,
                        color:      S.tx,
                        flex:       1,
                        wordBreak:  'break-word',
                        lineHeight: 1.4,
                      }}>
                        {err.message.length > 100 ? err.message.slice(0, 100) + '…' : err.message}
                      </span>
                      <button onClick={() => dismissOne(err.id)} style={{
                        flexShrink:   0,
                        background:   'none',
                        border:       'none',
                        color:        S.mu,
                        cursor:       'pointer',
                        fontSize:     12,
                        padding:      '0 2px',
                        lineHeight:   1,
                      }}>✕</button>
                    </div>

                    {/* AI analysis */}
                    <div style={{
                      background:   err.analyzing ? S.s2 : '#F0FDF4',
                      border:       `1px solid ${err.analyzing ? S.bd : '#86EFAC'}`,
                      borderRadius: 8,
                      padding:      '8px 10px',
                      fontSize:     12,
                      color:        err.analyzing ? S.mu : S.tx2,
                      lineHeight:   1.55,
                    }}>
                      {err.analyzing ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13 }}>🤖</span>
                          <span style={{ color: S.mu, fontStyle: 'italic' }}>Analyzing with Claude…</span>
                        </span>
                      ) : (
                        <span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: S.ok, marginRight: 5 }}>🤖 Claude:</span>
                          {err.analysis}
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div style={{ marginTop: 5, fontSize: 10, color: S.mu }}>
                      {err.url && <span>{err.url} · </span>}
                      {err.time.toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Panel footer */}
            <div style={{
              padding:      '8px 14px',
              borderTop:    `1px solid ${S.bd}`,
              background:   S.s2,
              fontSize:     11,
              color:        S.mu,
              flexShrink:   0,
              textAlign:    'center',
            }}>
              Powered by Claude · monitors JS, async & API errors
            </div>
          </div>
        </>
      )}
    </>
  )
}
