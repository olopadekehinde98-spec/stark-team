'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
}

type Tab = 'profile' | 'security' | 'notifications'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key:'profile',       label:'Profile',       icon:'👤' },
  { key:'security',      label:'Security',      icon:'🔒' },
  { key:'notifications', label:'Notifications', icon:'🔔' },
]

const NOTIF_PREFS = [
  { key:'notif_activity_verified', label:'Activity verified',    desc:'When a leader verifies one of your activities' },
  { key:'notif_activity_rejected', label:'Activity rejected',    desc:'When a leader rejects one of your activities' },
  { key:'notif_goal_reminder',     label:'Goal reminders',       desc:'Reminder when a goal deadline is approaching' },
  { key:'notif_rank_change',       label:'Rank changes',         desc:'When your rank is updated' },
  { key:'notif_recognition',       label:'Recognitions',         desc:'When you receive a badge or recognition' },
  { key:'notif_system',            label:'System announcements', desc:'Platform updates and team-wide messages' },
]

export default function SettingsPage() {
  const [tab,      setTab]      = useState<Tab>('profile')
  const [profile,  setProfile]  = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [bio,      setBio]      = useState('')
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState<{ text:string; ok:boolean }|null>(null)
  const [toggles,  setToggles]  = useState<Record<string,boolean>>({})
  const [showPw,   setShowPw]   = useState(false)
  const [pwSent,   setPwSent]   = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('users').select('*').eq('id', user.id).single().then(({ data }) => {
        if (!data) return
        setProfile(data)
        setFullName(data.full_name ?? '')
        setBio(data.bio ?? '')
        const t: Record<string,boolean> = {}
        NOTIF_PREFS.forEach(p => { t[p.key] = data[p.key] ?? true })
        setToggles(t)
      })
    })
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMsg(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    // Only bio is editable; name/username/email are admin-controlled
    const { error } = await supabase.from('users').update({ bio }).eq('id', user.id)
    setSaving(false)
    setMsg(error ? { text:'Failed: ' + error.message, ok:false } : { text:'Bio saved ✓', ok:true })
  }

  async function saveNotifs() {
    setSaving(true); setMsg(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('users').update(toggles).eq('id', user.id)
    setSaving(false)
    setMsg(error ? { text:'Failed: ' + error.message, ok:false } : { text:'Preferences saved ✓', ok:true })
  }

  async function sendPasswordReset() {
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setPwSent(true)
  }

  const input: React.CSSProperties = {
    width:'100%', padding:'10px 13px', borderRadius:8, fontSize:13,
    border:`1px solid ${S.bd}`, background:S.s2, color:S.tx, outline:'none',
  }

  if (!profile) return (
    <div style={{ padding:40, textAlign:'center', color:S.mu, fontSize:13 }}>Loading…</div>
  )

  return (
    <div style={{ maxWidth:640 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Settings</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:4, marginBottom:22 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setMsg(null) }} style={{
            flex:1, padding:'8px 0', borderRadius:7, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
            background: tab === t.key ? S.navy : 'transparent',
            color:      tab === t.key ? '#fff'  : S.tx2,
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Status message */}
      {msg && (
        <div style={{
          padding:'10px 14px', marginBottom:16, borderRadius:8, fontSize:13,
          background: msg.ok ? S.okBg : S.errBg,
          border:`1px solid ${msg.ok ? S.okBd : S.errBd}`,
          color: msg.ok ? S.ok : S.err,
        }}>
          {msg.text}
        </div>
      )}

      {/* ── PROFILE ── */}
      {tab === 'profile' && (
        <form onSubmit={saveProfile}>
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:24, marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
            {/* Avatar preview */}
            <div style={{ display:'flex', alignItems:'center', gap:16, paddingBottom:20, marginBottom:20, borderBottom:`1px solid ${S.bd}` }}>
              <div style={{
                width:52, height:52, borderRadius:'50%', background:S.navy, flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:18, fontWeight:800, color:S.gold,
              }}>
                {(fullName || '?').split(' ').map((w:string) => w[0]).join('').toUpperCase().slice(0,2)}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:S.tx }}>{fullName || '—'}</div>
                <div style={{ fontSize:12, color:S.mu, marginTop:2 }}>
                  {profile.rank?.replace(/_/g,' ')} · <span style={{ textTransform:'capitalize' }}>{profile.role}</span>
                </div>
                <div style={{ fontSize:11, color:S.mu, marginTop:2 }}>@{profile.username}</div>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:S.mu, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Full Name</label>
                <div style={{ ...input, background:S.s3, opacity:0.8, cursor:'default' }}>{fullName || '—'}</div>
                <div style={{ fontSize:11, color:S.mu, marginTop:4 }}>Name can only be changed by an admin.</div>
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:S.mu, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Username</label>
                <div style={{ ...input, background:S.s3, opacity:0.8, cursor:'default' }}>@{profile.username ?? ''}</div>
                <div style={{ fontSize:11, color:S.mu, marginTop:4 }}>Username cannot be changed.</div>
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:S.mu, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Email</label>
                <div style={{ ...input, background:S.s3, opacity:0.8, cursor:'default' }}>{profile.email ?? '—'}</div>
                <div style={{ fontSize:11, color:S.mu, marginTop:4 }}>Contact an admin to change your email.</div>
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:S.mu, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                  style={{ ...input, resize:'vertical' }}
                  placeholder="Tell your team a little about yourself…" />
              </div>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button type="submit" disabled={saving} style={{
              padding:'9px 24px', borderRadius:8, fontSize:13, fontWeight:700,
              background: saving ? S.mu : S.navy, color:'#fff', border:'none',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ── SECURITY ── */}
      {tab === 'security' && (
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:24, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ paddingBottom:20, marginBottom:20, borderBottom:`1px solid ${S.bd}` }}>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:4 }}>Password</div>
            <div style={{ fontSize:13, color:S.tx2, marginBottom:14 }}>
              We'll send a password reset link to <strong>{profile.email}</strong>
            </div>
            {pwSent ? (
              <div style={{ fontSize:13, color:S.ok, fontWeight:600 }}>✅ Reset email sent — check your inbox!</div>
            ) : (
              <button onClick={sendPasswordReset} style={{
                padding:'9px 20px', borderRadius:8, fontSize:13, fontWeight:600,
                background:S.s3, color:S.tx2, border:`1px solid ${S.bd}`, cursor:'pointer',
              }}>
                Send Password Reset Email
              </button>
            )}
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:4 }}>Email Address</div>
            <div style={{ fontSize:13, color:S.tx2 }}>{profile.email} — contact an admin to change your email.</div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {tab === 'notifications' && (
        <>
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, overflow:'hidden', marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
            {NOTIF_PREFS.map((p, i) => (
              <div key={p.key} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'14px 18px', borderBottom: i < NOTIF_PREFS.length - 1 ? `1px solid ${S.bd}` : 'none',
              }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:S.tx, marginBottom:2 }}>{p.label}</div>
                  <div style={{ fontSize:12, color:S.mu }}>{p.desc}</div>
                </div>
                {/* Toggle switch */}
                <div
                  onClick={() => setToggles(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                  style={{
                    width:44, height:24, borderRadius:12, cursor:'pointer', flexShrink:0, marginLeft:16,
                    background: toggles[p.key] ? S.ok : S.s3,
                    border:`1px solid ${toggles[p.key] ? S.okBd : S.bd}`,
                    position:'relative', transition:'background 0.2s',
                  }}>
                  <div style={{
                    width:18, height:18, borderRadius:'50%', background:'#fff',
                    position:'absolute', top:2,
                    left: toggles[p.key] ? 22 : 2,
                    transition:'left 0.2s',
                    boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button onClick={saveNotifs} disabled={saving} style={{
              padding:'9px 24px', borderRadius:8, fontSize:13, fontWeight:700,
              background: saving ? S.mu : S.navy, color:'#fff', border:'none',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
