'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.refresh()
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b0f1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50%       { transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }} />

      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: '15%', left: '50%',
        width: 700, height: 500, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.10) 0%, transparent 65%)',
        transform: 'translate(-50%, -50%)',
        animation: 'float 8s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '20%',
        width: 400, height: 300, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 440,
        margin: '0 16px',
        background: '#0d1117',
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: 20,
        padding: '40px 40px 32px',
        boxShadow: '0 0 0 1px rgba(99,102,241,0.08), 0 32px 80px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>
        {/* Top gradient line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, transparent, #6366f1, #8b5cf6, #6366f1, transparent)',
          borderRadius: '20px 20px 0 0',
        }} />

        {/* Corner accent */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 120, height: 120,
          background: 'radial-gradient(circle at top right, rgba(99,102,241,0.12), transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-block',
            filter: 'drop-shadow(0 0 24px rgba(99,102,241,0.5))',
            marginBottom: 12,
          }}>
            <Image src="/stark-logo.png" alt="Stark Team" width={160} height={107} priority style={{ display: 'block' }} />
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.20)',
            borderRadius: 20, padding: '4px 12px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, letterSpacing: '0.12em' }}>
              PRIVATE OPERATIONS PLATFORM
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: 10, color: '#374151', fontWeight: 700, letterSpacing: '0.14em' }}>SIGN IN</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: '11px 16px', marginBottom: 18, borderRadius: 10,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#f87171', fontSize: 12.5, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>⚠</span> {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', marginBottom: 7, fontSize: 11,
              fontWeight: 700, color: '#4b5563',
              textTransform: 'uppercase', letterSpacing: '0.10em',
            }}>Email Address</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="operative@stark.team"
              style={{
                width: '100%', padding: '11px 14px', fontSize: 13.5,
                boxSizing: 'border-box', background: '#111827',
                border: '1px solid #1f2937', borderRadius: 10,
                color: '#f1f5f9', outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
              onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
              onBlur={e => { e.target.style.borderColor = '#1f2937'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <label style={{
                fontSize: 11,
                fontWeight: 700, color: '#4b5563',
                textTransform: 'uppercase', letterSpacing: '0.10em',
              }}>Password</label>
              <a href="/forgot-password" style={{ fontSize: 11, color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
                Forgot password?
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%', padding: '11px 44px 11px 14px', fontSize: 13.5,
                  boxSizing: 'border-box', background: '#111827',
                  border: '1px solid #1f2937', borderRadius: 10,
                  color: '#f1f5f9', outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                onBlur={e => { e.target.style.borderColor = '#1f2937'; e.target.style.boxShadow = 'none' }}
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#4b5563', padding:0 }}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '13px 0', fontSize: 14, fontWeight: 700,
              letterSpacing: '0.04em',
              background: loading ? '#1f2937' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: loading ? '#4b5563' : '#fff',
              border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 24px rgba(99,102,241,0.35)',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.opacity = '0.90' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderTop: '2px solid #6b7280',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Signing in…
              </>
            ) : <>Sign In  →</>}
          </button>
        </form>

        <div style={{
          marginTop: 20, padding: '11px 16px', borderRadius: 10,
          background: 'rgba(99,102,241,0.05)',
          border: '1px solid rgba(99,102,241,0.12)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
          <span style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.5 }}>
            Invite-only platform — request access from your commanding officer
          </span>
        </div>
      </div>
    </div>
  )
}
