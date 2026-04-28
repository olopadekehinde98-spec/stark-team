'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const S = {
  bg: '#0b0f1a', card: '#0d1117', bd: 'rgba(99,102,241,0.25)',
  tx: '#f1f5f9', tx2: '#9ca3af', mu: '#4b5563',
  ok: '#10b981', err: '#f87171', accent: '#6366f1',
}

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    // Always redirect to production URL so the reset link works on any device
    const redirectTo = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
      : `${window.location.origin}/reset-password`
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
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
        {/* Top line */}
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
          }}>🔑</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: S.tx, marginBottom: 6 }}>Reset Password</h1>
          <p style={{ fontSize: 13, color: S.tx2 }}>Enter your email and we'll send a reset link</p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>📧</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: S.ok, marginBottom: 8 }}>Email sent!</div>
            <p style={{ fontSize: 13, color: S.tx2, marginBottom: 24, lineHeight: 1.6 }}>
              Check your inbox for a password reset link.<br />
              It may take a minute or two.
            </p>
            <a href="/login" style={{
              display: 'block', padding: '11px 0', borderRadius: 10,
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
              color: S.accent, fontSize: 13, fontWeight: 600, textDecoration: 'none',
              textAlign: 'center',
            }}>← Back to Login</a>
          </div>
        ) : (
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

            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block', marginBottom: 7, fontSize: 11, fontWeight: 700,
                color: S.mu, textTransform: 'uppercase', letterSpacing: '0.10em',
              }}>Email Address</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
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
              marginBottom: 16,
            }}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>

            <a href="/login" style={{
              display: 'block', textAlign: 'center', fontSize: 13,
              color: S.tx2, textDecoration: 'none', fontWeight: 500,
            }}>← Back to Login</a>
          </form>
        )}
      </div>
    </div>
  )
}
