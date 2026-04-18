'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0b0f1a', position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 400, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)',
      }} />

      {/* Panel */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 420, margin: '0 16px',
        background: '#111827', border: '1px solid #1f2937', borderRadius: 16,
        padding: '36px 36px 28px', overflow: 'hidden',
      }}>
        {/* Top gradient line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1)',
          borderRadius: '16px 16px 0 0',
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-block',
            filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.4))',
            marginBottom: 8,
          }}>
            <Image src="/stark-logo.png" alt="Stark Team" width={180} height={120} priority style={{ display: 'block' }} />
          </div>
          <div style={{ fontSize: 11, color: '#4b5563', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
            Private Operations Platform
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#1f2937' }} />
          <span style={{ fontSize: 10, color: '#4b5563', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Sign In
          </span>
          <div style={{ flex: 1, height: 1, background: '#1f2937' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: '10px 14px', marginBottom: 16, borderRadius: 8,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)',
              color: '#f87171', fontSize: 12, fontWeight: 500,
            }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block', marginBottom: 6, fontSize: 12,
              fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>Email</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="operative@stark.team"
              style={{ width: '100%', padding: '10px 14px', fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={{
              display: 'block', marginBottom: 6, fontSize: 12,
              fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>Password</label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{ width: '100%', padding: '10px 14px', fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="btn-primary"
            style={{
              width: '100%', padding: '12px 0', fontSize: 14,
              letterSpacing: '0.04em', opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.30)',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        {/* Warning */}
        <div style={{
          marginTop: 16, padding: '10px 14px', borderRadius: 8,
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>🔒</span>
          <span style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
            Invite-only platform — request access from your commanding officer
          </span>
        </div>
      </div>
    </div>
  )
}
