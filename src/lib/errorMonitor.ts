// Call this once from the private layout's useEffect
// It captures JS errors + unhandled promise rejections and POSTs them to /api/errors/report
// Rate-limited to 1 report per 5 seconds to avoid spam
let lastReported = 0
const COOLDOWN = 5000

export function initErrorMonitor(userId: string) {
  function report(payload: { type: string; message: string; page: string; stack?: string }) {
    const now = Date.now()
    if (now - lastReported < COOLDOWN) return
    lastReported = now
    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId }),
    }).catch(() => {})
  }

  const handleError = (event: ErrorEvent) => {
    report({ type: 'js_error', message: event.message, page: window.location.pathname, stack: event.error?.stack })
  }
  const handleRejection = (event: PromiseRejectionEvent) => {
    const msg = event.reason?.message ?? String(event.reason) ?? 'Unhandled promise rejection'
    report({ type: 'unhandled_rejection', message: msg, page: window.location.pathname, stack: event.reason?.stack })
  }

  window.addEventListener('error', handleError)
  window.addEventListener('unhandledrejection', handleRejection)
  return () => {
    window.removeEventListener('error', handleError)
    window.removeEventListener('unhandledrejection', handleRejection)
  }
}
