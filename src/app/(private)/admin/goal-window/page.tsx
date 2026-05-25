'use client'
import { useState, useEffect } from 'react'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
  warn:'#D97706', warnBg:'#FFFBEB', warnBd:'#FCD34D',
}

export default function GoalWindowPage() {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [toast,   setToast]   = useState('')
  const [toastOk, setToastOk] = useState(true)

  useEffect(() => {
    fetch('/api/admin/goal-window')
      .then(r => r.json())
      .then(d => { setOpen(d.open); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function flash(msg: string, ok = true) {
    setToast(msg); setToastOk(ok)
    setTimeout(() => setToast(''), 3500)
  }

  async function toggle() {
    setWorking(true)
    try {
      const res = await fetch('/api/admin/goal-window', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ open: !open }),
      })
      const d = await res.json()
      if (res.ok) {
        setOpen(d.open)
        flash(
          d.open
            ? 'Goal window opened! Push notification sent to all members.'
            : 'Goal window closed. Members can no longer create goals.',
          true,
        )
      } else {
        flash(d.error ?? 'Failed to update', false)
      }
    } catch {
      flash('Network error', false)
    }
    setWorking(false)
  }

  // eslint-disable-next-line react-hooks/purity
  const nigeriaHour = new Date(Date.now() + 60 * 60 * 1000).getUTCHours()
  const normallyOpen = nigeriaHour >= 5 && nigeriaHour < 12

  return (
    <div style={{ maxWidth: 560 }}>
      {toast && (
        <div style={{
          position:'fixed', top:20, right:20, zIndex:999,
          padding:'12px 20px', borderRadius:10, fontSize:13, fontWeight:600,
          background: toastOk ? S.navy : S.err, color:'#fff',
          boxShadow:'0 4px 16px rgba(0,0,0,0.25)',
        }}>{toast}</div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>
          Goal Window Control
        </h1>
        <p style={{ fontSize:13, color:S.tx2 }}>
          The goal window normally opens at <strong>5:00 AM</strong> and closes at <strong>12:00 PM</strong> Nigeria time.
          Use this to manually open it at any time — useful for exceptions or emergencies.
        </p>
      </div>

      {/* Current Nigeria time */}
      <div style={{
        background: S.s2, border:`1px solid ${S.bd}`, borderRadius:12,
        padding:'14px 18px', marginBottom:20, display:'flex', gap:12, alignItems:'center',
      }}>
        <span style={{ fontSize:24 }}>🕐</span>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:S.tx }}>
            Current Nigeria Time: {nigeriaHour.toString().padStart(2,'0')}:{new Date().getUTCMinutes().toString().padStart(2,'0')} WAT
          </div>
          <div style={{ fontSize:12, color:S.tx2, marginTop:2 }}>
            Normal window is {normallyOpen
              ? <span style={{ color:S.ok, fontWeight:700 }}>currently open</span>
              : <span style={{ color:S.err, fontWeight:700 }}>currently closed</span>}
          </div>
        </div>
      </div>

      {/* Big toggle card */}
      <div style={{
        background: open ? S.okBg : S.errBg,
        border:`2px solid ${open ? S.okBd : S.errBd}`,
        borderRadius:16, padding:'28px 24px', marginBottom:20,
        textAlign:'center',
      }}>
        <div style={{ fontSize:48, marginBottom:12 }}>{open ? '🔓' : '🔒'}</div>
        <div style={{ fontSize:20, fontWeight:800, color: open ? S.ok : S.err, marginBottom:6 }}>
          Goal Window is {open ? 'OPEN' : 'CLOSED'}
        </div>
        <div style={{ fontSize:13, color:S.tx2, marginBottom:20 }}>
          {open
            ? 'Members can currently create goals. Override is active.'
            : normallyOpen
              ? 'Normal window is open — no override needed.'
              : 'Override is off. Members cannot create goals right now.'}
        </div>
        <button
          onClick={toggle}
          disabled={working || loading}
          style={{
            padding:'13px 36px', borderRadius:10, fontSize:15, fontWeight:800,
            border:'none', cursor: working ? 'wait' : 'pointer',
            background: open ? S.err : S.ok,
            color:'#fff',
            boxShadow: `0 4px 16px ${open ? 'rgba(220,38,38,0.3)' : 'rgba(22,163,74,0.3)'}`,
            opacity: working || loading ? 0.7 : 1,
          }}>
          {working ? '…' : open ? '🔒 Close Goal Window' : '🔓 Open Goal Window'}
        </button>

        {open && (
          <div style={{ marginTop:16, fontSize:12, color:S.warn, fontWeight:600 }}>
            ⚡ A push notification was sent to all members when the window was opened.
          </div>
        )}
      </div>

      {/* Info box */}
      <div style={{
        background: S.goldBg, border:`1px solid ${S.goldBd}`, borderRadius:10,
        padding:'14px 16px', fontSize:13, color:S.tx2, lineHeight:1.7,
      }}>
        <strong style={{ color:S.navy }}>How it works:</strong>
        <ul style={{ margin:'8px 0 0', paddingLeft:20 }}>
          <li>When you open the window, a push notification is sent to <strong>all members with the app</strong>.</li>
          <li>The override stays active until you manually close it.</li>
          <li>Even with the override open, closing it returns to normal time rules.</li>
          <li>This override is for admin only — members have no control over it.</li>
        </ul>
      </div>
    </div>
  )
}
