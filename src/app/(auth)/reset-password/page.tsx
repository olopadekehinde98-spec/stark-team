'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const S = {
  bg: '#0b0f1a', card: '#0d1117', bd: 'rgba(99,102,241,0.25)',
  tx: '#f1f5f9', tx2: '#9ca3af', mu: '#4b5563',
  ok: '#10b981', err: '#f87171', accent: '#6366f1',
}

export default function ResetPasswordPage() {
  const router  = useRouter()
  const [ready,    setReady]    = useState(false)   // session established from link
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Supabase fires PASSWORD_RECOVERY when the user lands on this page
    // via the reset link — it automatically exchanges the token in the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
      // Also handle SIGNED_IN in case the exchange already happened
      if (event === 'SIGNED_IN') {
        setReady(true)
      }
    })

    // Also check immediately in case the session is already set
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
    // Sign out so they log in fresh with the new password
    await supabase.auth.signOut()
    setTimeout(() => router.push('/login'), 2500)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', fontSize: 13.5,
    boxSizing: 'border-box', background: '#111827',
    border: '1px solid #1f2937', borderRadius: 10,
    color: S.tx, outline: 'none',
    fontFamily: 'Inter, system-ui, sans-serif',
  }

  return (
    <div style={{
      minHeight: '100vh', background: S.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 16px', fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      <div style={{
        position: 'relative', width: '100%', maxWidth: 420,
        background: S.card, border: `1px solid ${S.bd}`,
        borderRadius: 20, padding: '40px 36px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg,transparent,#6366f1,#8b5cf6,#6366f1,transparent)',
          borderRadius: '20px 20px 0 0',
        }} />

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, marginBottom: 14,
          }}>🔐</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: S.tx, marginBottom: 6 }}>
            Set New Password
          </h1>
          <p style={{ fontSize: 13, color: S.tx2 }}>
            {ready ? 'Choose a strong new password' : 'Verifying your reset link…'}
          </p>
        </div>

        {/* Success state */}
        {success && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: S.ok, marginBottom: 8 }}>Password updated!</div>
            <p style={{ fontSize: 13, color: S.tx2 }}>Redirecting you to login…</p>
          </div>
        )}

        {/* Loading / verifying link */}
        {!success && !ready && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid rgba(99,102,241,0.2)',
              borderTop: '3px solid #6366f1',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ fontSize: 13, color: S.tx2 }}>
              Verifying your reset link…<br />
              <span style={{ fontSize: 12, color: S.mu }}>This only takes a moment.</span>
            </p>
            <p style={{ fontSize: 12, color: S.mu, marginTop: 20 }}>
              Link expired?{' '}
              <a href="/forgot-password" style={{ color: S.accent, textDecoration: 'none', fontWeight: 600 }}>
                Request a new one
              </a>
            </p>
          </div>
        )}

        {/* Form — only shown once session is confirmed */}
        {!success && ready && (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                padding: '11px 14px', marginBottom: 16, borderRadius: 10,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                color: S.err, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>⚠</span> {error}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', marginBottom: 7, fontSize: 11, fontWeight: 700,
                color: S.mu, textTransform: 'uppercase', letterSpacing: '0.10em',
              }}>New Password</label>
              <input
                type="password" required minLength={8}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = S.accent; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                onBlur={e => { e.target.style.borderColor = '#1f2937'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', marginBottom: 7, fontSize: 11, fontWeight: 700,
                color: S.mu, textTransform: 'uppercase', letterSpacing: '0.10em',
              }}>Confirm Password</label>
              <input
                type="password" required
                value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = S.accent; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                onBlur={e => { e.target.style.borderColor = '#1f2937'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
              background: loading ? '#1f2937' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: loading ? S.mu : '#fff', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 24px rgba(99,102,241,0.35)',
            }}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
