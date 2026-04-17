'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--gold)' }}>STARK TEAM</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Set a new password</p>
        </div>
        <div className="rounded-xl p-8 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#EF444420', color: 'var(--error)', border: '1px solid var(--error)' }}>{error}</div>}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>New Password</label>
              <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60"
              style={{ background: 'var(--gold)', color: '#0A0D14' }}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
