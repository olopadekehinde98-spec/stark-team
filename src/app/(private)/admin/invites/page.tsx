'use client'
import { useState, useEffect, useCallback } from 'react'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
  blue:'#2563EB', blueBg:'#EFF6FF', blueBd:'#BFDBFE',
}

const RANKS = [
  { value:'distributor',       label:'Distributor'    },
  { value:'manager',           label:'Manager'        },
  { value:'senior_manager',    label:'Senior Manager' },
  { value:'executive_manager', label:'Executive'      },
  { value:'director',          label:'Director'       },
]

function fmtDate(s?: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
}

function buildSignupUrl(token: string) {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  return `${base}/signup?token=${token}`
}

export default function AdminInvitesPage() {
  const [invites, setInvites]     = useState<any[]>([])
  const [creating, setCreating]   = useState(false)
  const [copied, setCopied]       = useState<string | null>(null)
  const [form, setForm]           = useState({ role:'member', rank:'distributor', email:'', expires_days:'30' })
  const [toast, setToast]         = useState('')

  const loadInvites = useCallback(async () => {
    const r = await fetch('/api/invites')
    if (r.ok) { const d = await r.json(); setInvites(d.invites ?? []) }
  }, [])

  useEffect(() => { loadInvites() }, [loadInvites])

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function createInvite(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const r = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assigned_role:  form.role,
        assigned_rank:  form.rank,
        assigned_email: form.email || null,
        expires_days:   Number(form.expires_days),
      }),
    })
    const d = await r.json()
    setCreating(false)
    if (d.invite_url) {
      flash('Invite link created!')
      await loadInvites()
      // Auto-open email if address provided
      if (form.email) {
        const subject = encodeURIComponent('You have been invited to join Stark Team')
        const body = encodeURIComponent(
          `Hi,\n\nYou've been invited to join Stark Team!\n\nClick the link below to create your account:\n\n${d.invite_url}\n\nThis link expires in ${form.expires_days} days.\n\nSee you inside!`
        )
        window.open(`mailto:${form.email}?subject=${subject}&body=${body}`)
      }
      setForm(f => ({ ...f, email: '' }))
    } else {
      flash('Error: ' + (d.error ?? 'Something went wrong'))
    }
  }

  async function copyLink(token: string) {
    const url = buildSignupUrl(token)
    await navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2500)
  }

  function emailLink(inv: any) {
    const url  = buildSignupUrl(inv.token)
    const rank = RANKS.find(r => r.value === inv.assigned_rank)?.label ?? inv.assigned_rank
    const subject = encodeURIComponent('You have been invited to join Stark Team')
    const body = encodeURIComponent(
      `Hi${inv.assigned_email ? '' : ' there'},\n\nYou've been invited to join Stark Team as a ${rank}!\n\nClick the link below to create your account:\n\n${url}\n\nThis link expires ${fmtDate(inv.expires_at)}.\n\nSee you inside!`
    )
    const to = inv.assigned_email ? inv.assigned_email : ''
    window.open(`mailto:${to}?subject=${subject}&body=${body}`)
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'9px 12px', borderRadius:8, fontSize:13, color:S.tx,
    border:`1px solid ${S.bd}`, background:S.s2, outline:'none',
  }

  const active  = invites.filter(i => i.is_active && !i.used_by && new Date(i.expires_at) > new Date())
  const used    = invites.filter(i => i.used_by)
  const expired = invites.filter(i => !i.used_by && (!i.is_active || new Date(i.expires_at) <= new Date()))

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:999, background:S.navy, color:'#fff', padding:'10px 18px', borderRadius:8, fontSize:13, fontWeight:600, boxShadow:'0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Invite Links</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>Create invite links · copy them anytime · send via email</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:20, alignItems:'start' }}>

        {/* ── Create form ── */}
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:22, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:18 }}>Create Invite Link</h2>
          <form onSubmit={createInvite}>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:S.tx2, marginBottom:6 }}>Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role:e.target.value }))} style={inputStyle}>
                  <option value="member">Member</option>
                  <option value="leader">Leader</option>
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:S.tx2, marginBottom:6 }}>Starting Rank</label>
                <select value={form.rank} onChange={e => setForm(f => ({ ...f, rank:e.target.value }))} style={inputStyle}>
                  {RANKS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:S.tx2, marginBottom:6 }}>
                  Member Email <span style={{ color:S.mu, fontWeight:400 }}>(optional — will open email app)</span>
                </label>
                <input
                  type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email:e.target.value }))}
                  placeholder="member@gmail.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:S.tx2, marginBottom:6 }}>Expires in (days)</label>
                <input type="number" min="1" max="90" value={form.expires_days}
                  onChange={e => setForm(f => ({ ...f, expires_days:e.target.value }))} style={inputStyle} />
              </div>
              <button type="submit" disabled={creating} style={{
                padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:700,
                background: creating ? S.mu : S.navy, color:'#fff', border:'none',
                cursor: creating ? 'not-allowed' : 'pointer',
              }}>
                {creating ? 'Creating…' : '+ Create Invite Link'}
              </button>
            </div>
          </form>
          <div style={{ marginTop:14, fontSize:12, color:S.mu, lineHeight:1.6 }}>
            💡 If you enter an email above, your email app will open automatically with the link ready to send.
          </div>
        </div>

        {/* ── Invite list ── */}
        <div>
          {invites.length === 0 ? (
            <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:40, textAlign:'center', color:S.mu, fontSize:13 }}>
              No invite links yet. Create one to get started.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[...active, ...used, ...expired].map((inv: any) => {
                const isUsed    = !!inv.used_by
                const isExpired = !inv.is_active || new Date(inv.expires_at) <= new Date()
                const isActive  = !isUsed && !isExpired
                const url       = buildSignupUrl(inv.token)
                const isCopied  = copied === inv.token

                return (
                  <div key={inv.id} style={{
                    background:S.s1, border:`1px solid ${isActive ? S.okBd : S.bd}`,
                    borderRadius:12, padding:16, boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
                    opacity: isUsed || isExpired ? 0.7 : 1,
                  }}>
                    {/* Top row */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{
                          fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
                          background: isUsed ? S.s3 : isActive ? S.okBg : S.errBg,
                          color:      isUsed ? S.mu  : isActive ? S.ok   : S.err,
                          border:    `1px solid ${isUsed ? S.bd : isActive ? S.okBd : S.errBd}`,
                        }}>
                          {isUsed ? '✓ Used' : isActive ? '● Active' : '✕ Expired'}
                        </span>
                        <span style={{ fontSize:13, fontWeight:600, color:S.tx }}>
                          {RANKS.find(r => r.value === inv.assigned_rank)?.label ?? inv.assigned_rank}
                        </span>
                        <span style={{ fontSize:12, color:S.tx2, textTransform:'capitalize' }}>· {inv.assigned_role}</span>
                      </div>
                      <span style={{ fontSize:11, color:S.mu }}>Expires {fmtDate(inv.expires_at)}</span>
                    </div>

                    {/* URL row */}
                    <div style={{
                      background:S.s2, border:`1px solid ${S.bd}`, borderRadius:8,
                      padding:'8px 12px', marginBottom:10,
                      fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:S.tx2,
                      wordBreak:'break-all', lineHeight:1.5,
                    }}>
                      {url}
                    </div>

                    {/* Email locked to */}
                    {inv.assigned_email && (
                      <div style={{ fontSize:12, color:S.tx2, marginBottom:10 }}>
                        📧 For: <strong>{inv.assigned_email}</strong>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => copyLink(inv.token)} style={{
                        padding:'7px 16px', borderRadius:7, fontSize:12, fontWeight:700,
                        background: isCopied ? S.ok : S.navy, color:'#fff',
                        border:'none', cursor:'pointer', transition:'background 0.2s',
                      }}>
                        {isCopied ? '✓ Copied!' : '📋 Copy Link'}
                      </button>
                      {!isUsed && (
                        <button onClick={() => emailLink(inv)} style={{
                          padding:'7px 16px', borderRadius:7, fontSize:12, fontWeight:700,
                          background:S.goldBg, color:S.gold,
                          border:`1px solid ${S.goldBd}`, cursor:'pointer',
                        }}>
                          ✉️ Send Email
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
