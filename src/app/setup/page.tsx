'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/setup')
      .then(r => r.json())
      .then(d => {
        if (!d.setupRequired) setAlreadyDone(true)
        setChecking(false)
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, username }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 13,
    background: '#1f2937', border: '1px solid #374151',
    borderRadius: 8, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box',
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f1a' }}>
      <div style={{ color: '#6b7280', fontSize: 13 }}>Checking setup status…</div>
    </div>
  )

  if (alreadyDone) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f1a' }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Setup Already Complete</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
          An admin account already exists. Use your invite link to join, or go to login.
        </div>
        <button onClick={() => router.push('/login')} style={{
          padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer',
        }}>Go to Login →</button>
      </div>
    </div>
  )

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f1a' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>Admin account created!</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>Redirecting to login…</div>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0b0f1a', padding: '0 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚙️</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>
            First-Time Setup
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
            Create the administrator account for Stark Team.<br />
            This page is only available once.
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#111827', border: '1px solid #1f2937',
          borderRadius: 16, padding: '32px 28px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Top accent line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          }} />

          <div style={{
            marginBottom: 20, padding: '10px 14px', borderRadius: 8,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            fontSize: 12, color: '#f59e0b',
          }}>
            ⚠ This admin account will have full platform access. Keep credentials safe.
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              fontSize: 12, color: '#f87171',
            }}>⚠ {error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Full Name
              </label>
              <input style={inputStyle} required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Tony Stark" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Username
              </label>
              <input style={inputStyle} required value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="tonystark" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Email
              </label>
              <input style={inputStyle} type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@stark.team" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Password
              </label>
              <input style={inputStyle} type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" />
            </div>

            <button type="submit" disabled={loading} style={{
              marginTop: 6, padding: '12px 0', borderRadius: 8, fontSize: 14, fontWeight: 700,
              background: loading ? '#4338ca' : '#6366f1', border: 'none', color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
            }}>
              {loading ? 'Creating Admin Account…' : 'Create Admin Account →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
