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
      background: 'var(--bg)', position: 'relative', overflow: 'hidden',
    }}>

      {/* ── BLUE ELECTRIC AMBIENT GLOW ─────────────── */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse at center, rgba(32,200,224,0.06) 0%, rgba(10,30,80,0.04) 50%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* ── CENTER PANEL ───────────────────────────── */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 420, margin: '0 16px',
        background: 'var(--s1)', border: '1px solid var(--b2)',
        padding: '0 36px 32px',
      }}>

        {/* Top blue electric line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #20C8E0, #4DA8FF, #20C8E0, transparent)',
        }} />

        {/* Top corner brackets — blue */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 14, height: 14, borderTop: '2px solid #20C8E0', borderLeft: '2px solid #20C8E0' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderTop: '2px solid #20C8E0', borderRight: '2px solid #20C8E0' }} />

        {/* ── LOGO ───────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 24, paddingTop: 32 }}>

          {/* Logo image with electric glow */}
          <div style={{
            position: 'relative', display: 'inline-block',
            filter: 'drop-shadow(0 0 18px rgba(32,200,224,0.45)) drop-shadow(0 0 40px rgba(77,168,255,0.20))',
            marginBottom: 10,
          }}>
            <Image
              src="/stark-logo.png"
              alt="Stark Team"
              width={200}
              height={133}
              priority
              style={{ display: 'block', objectFit: 'contain' }}
            />
          </div>

          <div className="font-mono" style={{
            fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase',
            color: 'var(--text-muted)', marginTop: 4,
          }}>AUTHORIZED PERSONNEL ONLY</div>
        </div>

        {/* ── DIVIDER ────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--b1)' }} />
          <span className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.22em' }}>
            IDENTITY VERIFICATION
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--b1)' }} />
        </div>

        {/* ── FORM ───────────────────────────────────── */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: '10px 14px', marginBottom: 16,
              background: 'rgba(232,48,64,0.08)', border: '1px solid rgba(232,48,64,0.25)',
              color: 'var(--danger)', fontFamily: 'Share Tech Mono, monospace',
              fontSize: 11, letterSpacing: '0.05em',
            }}>
              ⚠ {error.toUpperCase()}
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
              style={{ width: '100%', padding: '10px 14px', fontSize: 13, boxSizing: 'border-box' }}
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
              style={{ width: '100%', padding: '10px 14px', fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '13px 0',
              background: loading
                ? 'rgba(32,200,224,0.4)'
                : 'linear-gradient(135deg, #1570C8 0%, #20C8E0 100%)',
              color: '#fff',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 14, letterSpacing: '0.22em', textTransform: 'uppercase',
              border: 'none', borderRadius: 0,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
              boxShadow: loading ? 'none' : '0 0 20px rgba(32,200,224,0.25)',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            {loading ? 'AUTHENTICATING...' : '⚡ AUTHENTICATE'}
          </button>
        </form>

        {/* ── INVITE WARNING ──────────────────────────── */}
        <div style={{
          marginTop: 18, padding: '8px 12px',
          background: 'rgba(32,200,224,0.04)',
          border: '1px solid rgba(32,200,224,0.15)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span className="font-mono" style={{ fontSize: 9, color: '#20C8E0', letterSpacing: '0.05em', flexShrink: 0 }}>[!]</span>
          <span className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            INVITE-ONLY PLATFORM — REQUEST ACCESS FROM YOUR COMMANDING OFFICER
          </span>
        </div>

        {/* Bottom corner brackets */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 14, height: 14, borderLeft: '2px solid var(--b3)', borderBottom: '2px solid var(--b3)' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRight: '2px solid var(--b3)', borderBottom: '2px solid var(--b3)' }} />
      </div>
    </div>
  )
}
