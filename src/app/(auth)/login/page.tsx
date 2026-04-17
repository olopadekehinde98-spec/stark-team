'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg)' }}>

      {/* ── CENTER PANEL ───────────────────────── */}
      <div className="relative w-full max-w-[400px] mx-4 panel panel-bracket"
        style={{ border: '1px solid var(--b2)', padding: '40px 36px 32px' }}>

        {/* Top gold line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
        }} />

        {/* ── LOGO ─────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="hexagon" style={{
            width: 56, height: 56, background: 'var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <span style={{
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 20, color: '#03060A', letterSpacing: '0.05em',
            }}>ST</span>
          </div>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            fontSize: 22, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--text-primary)', marginBottom: 4,
          }}>STARK TEAM</div>
          <div className="font-mono" style={{
            fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>AUTHORIZED PERSONNEL ONLY</div>
        </div>

        {/* ── DIVIDER ──────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--b1)' }} />
          <span className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
            AUTH PORTAL
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--b1)' }} />
        </div>

        {/* ── FORM ─────────────────────────────── */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: '10px 14px', marginBottom: 16,
              background: 'rgba(232,48,64,0.08)',
              border: '1px solid rgba(232,48,64,0.25)',
              color: 'var(--danger)',
              fontFamily: 'Share Tech Mono, monospace', fontSize: 11,
              letterSpacing: '0.05em',
            }}>
              {error.toUpperCase()}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label className="font-mono" style={{
              display: 'block', marginBottom: 6,
              fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}>
              OPERATIVE EMAIL
            </label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="operative@stark.team"
              style={{ width: '100%', padding: '10px 14px', fontSize: 13 }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="font-mono" style={{
              display: 'block', marginBottom: 6,
              fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}>
              ACCESS CODE
            </label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{ width: '100%', padding: '10px 14px', fontSize: 13 }}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px 0',
              background: loading ? 'rgba(200,168,75,0.5)' : 'var(--gold)',
              color: '#03060A',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 14, letterSpacing: '0.18em', textTransform: 'uppercase',
              border: 'none', borderRadius: 0,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}>
            {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </button>
        </form>

        {/* ── INVITE WARNING ───────────────────── */}
        <div style={{
          marginTop: 20, padding: '8px 12px',
          background: 'rgba(200,168,75,0.05)',
          border: '1px solid var(--gold-border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div className="font-mono" style={{ fontSize: 8, color: 'var(--gold)', letterSpacing: '0.05em' }}>
            [!]
          </div>
          <div className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            INVITE-ONLY PLATFORM — REQUEST ACCESS FROM YOUR COMMANDING OFFICER
          </div>
        </div>

        {/* Bottom corner brackets */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          width: 12, height: 12,
          borderLeft: '2px solid var(--gold)', borderBottom: '2px solid var(--gold)',
          opacity: 0.5,
        }} />
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 12, height: 12,
          borderRight: '2px solid var(--gold)', borderBottom: '2px solid var(--gold)',
          opacity: 0.5,
        }} />
      </div>
    </div>
  )
}
