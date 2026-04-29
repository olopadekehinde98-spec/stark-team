'use client'
import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const S = {
  bg: '#F0F4F8', s1: '#FFFFFF', s2: '#F8FAFC', bd: '#E2E8F0',
  navy: '#0F1C2E', gold: '#D4A017', goldBg: '#FEF9EC', goldBd: '#F5D87A',
  tx: '#0F172A', tx2: '#475569', mu: '#94A3B8',
  err: '#DC2626', errBg: '#FEF2F2', errBd: '#FCA5A5',
}

function SignupForm() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const token       = searchParams.get('token')

  const [invite,      setInvite]      = useState<any>(null)
  const [inviteError, setInviteError] = useState('')
  const [fullName,    setFullName]    = useState('')
  const [username,    setUsername]    = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)

  useEffect(() => {
    if (!token) {
      setInviteError('No invite token. Please use a valid invite link.')
      return
    }
    fetch(`/api/invites/validate/${token}`)
      .then(r => {
        if (!r.ok && r.status !== 410 && r.status !== 404) throw new Error(`Server error ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (!data.valid) {
          setInviteError(data.reason ?? 'This invite link is invalid or has expired.')
          return
        }
        setInvite(data)
        if (data.assigned_email) setEmail(data.assigned_email)
      })
      .catch(() => setInviteError('Could not validate invite link. Please try again or contact your team leader.'))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Create account via API — this validates the invite, inserts the user profile, and marks the invite used
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, username, token }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Signup failed'); setLoading(false); return }

    // Sign in so the browser gets a session
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (!signInError) {
      router.push('/dashboard')
    } else {
      // Email confirmation is ON — user must confirm before logging in
      setError('✅ Account created! Check your email and click the confirmation link, then log in.')
      setLoading(false)
    }
  }

  const rankMap: Record<string, string> = {
    member: 'Member', distributor: 'Distributor', manager: 'Manager',
    senior_manager: 'Senior Manager', executive_manager: 'Executive', director: 'Director',
  }

  // Error state
  if (inviteError) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:S.bg, padding:'0 16px' }}>
        <div style={{ textAlign:'center', maxWidth:420 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔗</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:S.err, marginBottom:10 }}>Invalid Invite</h1>
          <p style={{ fontSize:14, color:S.tx2, marginBottom:24 }}>{inviteError}</p>
          <p style={{ fontSize:13, color:S.mu }}>Contact your team leader to get a new invite link.</p>
        </div>
      </div>
    )
  }

  // Loading state
  if (!invite) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:S.bg }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:13, color:S.mu }}>Validating invite link…</div>
        </div>
      </div>
    )
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
    border: `1px solid ${S.bd}`, background: S.s2, color: S.tx,
    outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:S.bg, padding:'24px 16px' }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{
            width:48, height:48, background:S.navy, borderRadius:10,
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            fontSize:18, fontWeight:800, color:S.gold, marginBottom:12,
          }}>ST</div>
          <h1 style={{ fontSize:24, fontWeight:800, color:S.navy, letterSpacing:'-0.03em', marginBottom:4 }}>Join Stark Team</h1>
          <p style={{ fontSize:13, color:S.tx2 }}>Create your account to get started</p>
        </div>

        {/* Invite banner */}
        <div style={{
          background:S.goldBg, border:`1px solid ${S.goldBd}`, borderRadius:10,
          padding:'12px 16px', marginBottom:20, fontSize:13, color:'#92400E',
        }}>
          You&apos;ve been invited as a <strong style={{ color:S.navy }}>
            {invite.assigned_role === 'leader' ? 'Leader' : 'Member'}
          </strong>
          {invite.assigned_rank && (
            <> · <strong style={{ color:S.gold }}>{rankMap[invite.assigned_rank] ?? invite.assigned_rank}</strong></>
          )}
        </div>

        {/* Form card */}
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:14, padding:28, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background:S.errBg, border:`1px solid ${S.errBd}`, borderRadius:8,
                padding:'10px 14px', fontSize:13, color:S.err, marginBottom:16,
              }}>{error}</div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:S.tx2, marginBottom:6 }}>Full Name</label>
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} placeholder="Samuel Olopade" />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:S.tx2, marginBottom:6 }}>Username</label>
                <input type="text" required value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  style={inputStyle} placeholder="samuel_o" />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:S.tx2, marginBottom:6 }}>Email</label>
                <input type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={!!invite.assigned_email}
                  style={{ ...inputStyle, opacity: invite.assigned_email ? 0.7 : 1 }}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:S.tx2, marginBottom:6 }}>Password</label>
                <div style={{ position:'relative' }}>
                  <input type={showPw ? 'text' : 'password'} required minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)}
                    style={{ ...inputStyle, paddingRight:44 }} placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:S.mu, padding:0 }}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                  <span style={{ fontSize:11, color: password.length > 0 && password.length < 8 ? S.err : S.mu }}>
                    {password.length > 0 && password.length < 8 ? `${8 - password.length} more characters needed` : 'Minimum 8 characters'}
                  </span>
                  <span style={{ fontSize:11, color: password.length >= 8 ? '#16A34A' : S.mu }}>
                    {password.length}/128
                  </span>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                style={{
                  width:'100%', padding:'11px', borderRadius:8, fontSize:14, fontWeight:700,
                  background: loading ? S.mu : S.navy, color:'#fff',
                  border:'none', cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop:4,
                }}
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F0F4F8' }}>
        <p style={{ color:'#94A3B8', fontSize:13 }}>Loading…</p>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
