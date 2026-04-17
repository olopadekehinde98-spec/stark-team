'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--gold)' }}>STARK TEAM</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Reset your password</p>
        </div>
        <div className="rounded-xl p-8 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          {sent ? (
            <div className="text-center space-y-3">
              <p className="text-sm" style={{ color: 'var(--success)' }}>Check your email for a password reset link.</p>
              <Link href="/login" className="text-sm" style={{ color: 'var(--gold)' }}>Back to login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60"
                style={{ background: 'var(--gold)', color: '#0A0D14' }}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <Link href="/login" className="block text-center text-sm" style={{ color: 'var(--text-muted)' }}>Back to login</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
