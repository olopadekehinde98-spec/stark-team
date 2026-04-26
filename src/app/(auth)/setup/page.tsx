'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SetupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', full_name: '', username: '', setup_key: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [done, setDone]     = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res  = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  const field = (label: string, key: string, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block', marginBottom: 6,
        fontFamily: '"Share Tech Mono", monospace',
        fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3D6070',
      }}>{label}</label>
      <input
        type={type} required value={(form as any)[key]}
        onChange={set(key)} placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 14px', fontSize: 13,
          background: '#0F1C2E', border: '1px solid #1E3348',
          color: '#e2e8f0', outline: 'none', borderRadius: 0, boxSizing: 'border-box',
        }}
      />
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#03060A', padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: '#070D14', border: '1px solid #1E3348', position: 'relative',
      }}>
        {/* Gold top line */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #C8A84B, transparent)' }} />

        <div style={{ padding: '32px 32px 28px' }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontFamily: '"Share Tech Mono", monospace',
              fontSize: 14, fontWeight: 700, color: '#C8A84B',
              letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6,
            }}>
              FIRST-TIME SETUP
            </div>
            <div style={{ fontSize: 12, color: '#3D6070', fontFamily: '"Share Tech Mono", monospace', lineHeight: 1.6 }}>
              Create the initial admin account. This page will be disabled once an admin exists.
            </div>
          </div>

          {done ? (
            <div style={{
              padding: '16px', background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.25)', color: '#10b981',
              fontFamily: '"Share Tech Mono", monospace', fontSize: 12, lineHeight: 1.6,
            }}>
              ✓ ADMIN ACCOUNT CREATED. Redirecting to login…
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {field('Full Name', 'full_name', 'text', 'John Stark')}
              {field('Username', 'username', 'text', 'jstark')}
              {field('Email', 'email', 'email', 'admin@stark.team')}
              {field('Password', 'password', 'password', '••••••••••••')}
              {field('Setup Key', 'setup_key', 'password', 'From your .env.local CRON_SECRET')}

              {error && (
                <div style={{
                  padding: '10px 14px', marginBottom: 16,
                  background: 'rgba(232,48,64,0.08)', border: '1px solid rgba(232,48,64,0.25)',
                  color: '#E83040', fontFamily: '"Share Tech Mono", monospace', fontSize: 11,
                }}>!! {error}</div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '12px', marginTop: 4,
                background: loading ? '#1E3348' : '#C8A84B',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                color: loading ? '#3D6070' : '#03060A',
                fontFamily: '"Share Tech Mono", monospace',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
              }}>
                {loading ? 'CREATING ACCOUNT…' : 'INITIALIZE ADMIN'}
              </button>

              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Link href="/login" style={{
                  fontFamily: '"Share Tech Mono", monospace', fontSize: 10,
                  color: '#3D6070', textDecoration: 'none', letterSpacing: '0.10em',
                }}>← BACK TO LOGIN</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
