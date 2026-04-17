'use client'
import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [invite, setInvite] = useState<any>(null)
  const [inviteError, setInviteError] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) { setInviteError('No invite token. Please use a valid invite link.'); return }
    fetch(`/api/invites/validate/${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.valid) { setInviteError(data.reason); return }
        setInvite(data)
        if (data.assigned_email) setEmail(data.assigned_email)
      })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, username, invite_token: token } },
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    router.push('/dashboard')
  }

  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--error)' }}>Invalid Invite</h1>
          <p style={{ color: 'var(--text-muted)' }}>{inviteError}</p>
        </div>
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Validating invite…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--gold)' }}>STARK TEAM</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Create your account</p>
        </div>
        <div className="rounded-lg px-4 py-3 mb-6 text-sm" style={{ background: 'var(--gold-muted)', border: '1px solid var(--gold)', color: 'var(--gold-light)' }}>
          You&apos;ve been invited as a <strong>{invite.assigned_role}</strong> ({invite.assigned_rank.replace('_', ' ')})
        </div>
        <div className="rounded-xl p-8 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#EF444420', color: 'var(--error)', border: '1px solid var(--error)' }}>
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Username</label>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g,''))}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={!!invite.assigned_email}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none disabled:opacity-60"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-semibold mt-2 transition-opacity disabled:opacity-60"
              style={{ background: 'var(--gold)', color: '#0A0D14' }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
