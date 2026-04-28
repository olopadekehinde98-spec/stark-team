'use client'
import { useState, useEffect } from 'react'

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

export default function AdminInvitesPage() {
  const [invites, setInvites]   = useState<any[]>([])
  const [creating, setCreating] = useState(false)
  const [copied, setCopied]     = useState(false)
  const [form, setForm]         = useState({ role:'member', rank:'distributor', email:'', expires_days:'7' })
  const [newLink, setNewLink]   = useState('')

  useEffect(() => { loadInvites() }, [])

  async function loadInvites() {
    const r = await fetch('/api/invites')
    if (r.ok) {
      const d = await r.json()
      setInvites(d.invites ?? [])
    }
  }

  async function createInvite(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setNewLink('')
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
      setNewLink(d.invite_url)
      loadInvites()
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(newLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputStyle = {
    width:'100%', padding:'9px 12px', borderRadius:8, fontSize:13, color:S.tx,
    border:`1px solid ${S.bd}`, background:S.s2, outline:'none',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Invite Links</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>Create invite links for new members to join under your team</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Create form */}
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
                  {RANKS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:S.tx2, marginBottom:6 }}>
                  Lock to Email <span style={{ color:S.mu }}>(optional)</span>
                </label>
                <input
                  type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email:e.target.value }))}
                  placeholder="member@example.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:S.tx2, marginBottom:6 }}>Expires in (days)</label>
                <input
                  type="number" min="1" max="30" value={form.expires_days}
                  onChange={e => setForm(f => ({ ...f, expires_days:e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <button
                type="submit" disabled={creating}
                style={{
                  padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:700,
                  background: creating ? S.mu : S.navy, color:'#fff', border:'none',
                  cursor: creating ? 'not-allowed' : 'pointer',
                }}
              >
                {creating ? 'Creating…' : '+ Create Invite Link'}
              </button>
            </div>
          </form>

          {/* Generated link */}
          {newLink && (
            <div style={{ marginTop:16, background:S.goldBg, border:`1px solid ${S.goldBd}`, borderRadius:10, padding:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:S.gold, marginBottom:8 }}>✓ Invite link created — share this:</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:S.tx, wordBreak:'break-all', marginBottom:10 }}>{newLink}</div>
              <button
                onClick={copyLink}
                style={{
                  padding:'6px 14px', borderRadius:6, fontSize:12, fontWeight:700,
                  background: copied ? S.ok : S.gold, color:'#fff', border:'none', cursor:'pointer',
                }}
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
          )}
        </div>

        {/* Existing invites */}
        <div>
          <h2 style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:14 }}>Recent Invites</h2>
          {invites.length === 0 ? (
            <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:30, textAlign:'center', color:S.mu, fontSize:13 }}>
              No invite links yet. Create one above.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {invites.map((inv: any) => {
                const isUsed   = !!inv.used_by
                const isActive = inv.is_active && !isUsed && new Date(inv.expires_at) > new Date()
                return (
                  <div key={inv.id} style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:14, boxShadow:'0 1px 2px rgba(0,0,0,0.03)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                          <span style={{
                            fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:12,
                            background: isUsed ? S.s3 : isActive ? S.okBg : S.errBg,
                            color:      isUsed ? S.mu  : isActive ? S.ok   : S.err,
                            border:    `1px solid ${isUsed ? S.bd : isActive ? S.okBd : S.errBd}`,
                          }}>
                            {isUsed ? 'Used' : isActive ? 'Active' : 'Expired'}
                          </span>
                          <span style={{ fontSize:12, fontWeight:600, color:S.tx }}>
                            {RANKS.find(r => r.value === inv.assigned_rank)?.label ?? inv.assigned_rank}
                            {' · '}
                            <span style={{ textTransform:'capitalize' }}>{inv.assigned_role}</span>
                          </span>
                        </div>
                        {inv.assigned_email && (
                          <div style={{ fontSize:11, color:S.tx2, marginBottom:4 }}>
                            Locked to: {inv.assigned_email}
                          </div>
                        )}
                        <div style={{ fontSize:11, color:S.mu }}>
                          Expires {fmtDate(inv.expires_at)}
                        </div>
                      </div>
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
