'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
}

type Tab = 'profile' | 'security' | 'notifications' | 'app'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key:'profile',       label:'Profile',       icon:'👤' },
  { key:'security',      label:'Security',      icon:'🔒' },
  { key:'notifications', label:'Notifications', icon:'🔔' },
  { key:'app',           label:'Install App',   icon:'📲' },
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
  const [tab,        setTab]      = useState<Tab>('profile')
  const [profile,    setProfile]  = useState<any>(null)
  const [fullName,   setFullName] = useState('')
  const [bio,        setBio]      = useState('')
  const [saving,     setSaving]   = useState(false)
  const [msg,        setMsg]      = useState<{ text:string; ok:boolean }|null>(null)
  const [toggles,    setToggles]  = useState<Record<string,boolean>>({})
  const [showPw,     setShowPw]   = useState(false)
  const [pwSent,     setPwSent]   = useState(false)
  const [installable,  setInstallable]   = useState(false)
  const [installed,    setInstalled]     = useState(false)
  const [isStandalone, setIsStandalone]  = useState(false)
  const [isIOS,        setIsIOS]         = useState(false)
  const [pushStatus,   setPushStatus]    = useState<'unknown'|'granted'|'denied'|'unsupported'>('unknown')
  const [pushLoading,  setPushLoading]   = useState(false)
  const deferredPrompt = useRef<any>(null)

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
    // Push notification status
    if (!('PushManager' in window)) {
      setPushStatus('unsupported')
    } else if (Notification.permission === 'granted') {
      setPushStatus('granted')
    } else if (Notification.permission === 'denied') {
      setPushStatus('denied')
    }

    // PWA detection
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)
    // Check if already running as installed standalone app
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true
    setIsStandalone(standalone)
    if (standalone) setInstalled(true)

    const handler = (e: Event) => { e.preventDefault(); deferredPrompt.current = e; setInstallable(true) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => { setInstalled(true); setInstallable(false) })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt.current) return
    deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice
    if (outcome === 'accepted') setInstalled(true)
    deferredPrompt.current = null
    setInstallable(false)
  }

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

  async function enablePush() {
    if (!('PushManager' in window) || !('serviceWorker' in navigator)) return
    setPushLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setPushStatus('denied'); setPushLoading(false); return }
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      })
      const json = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
      })
      setPushStatus('granted')
      setMsg({ text: '🔔 Push notifications enabled!', ok: true })
    } catch (e) {
      setMsg({ text: 'Could not enable notifications. Try again.', ok: false })
    }
    setPushLoading(false)
  }

  async function disablePush() {
    setPushLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setPushStatus('unknown')
      setMsg({ text: 'Push notifications disabled.', ok: true })
    } catch {
      setMsg({ text: 'Could not disable notifications.', ok: false })
    }
    setPushLoading(false)
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
          {/* Push notification card */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:'18px 20px', marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ fontSize:22 }}>🔔</span>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:S.tx }}>Phone Push Notifications</div>
                <div style={{ fontSize:12, color:S.mu, marginTop:1 }}>Get notified on your phone even when the app is closed</div>
              </div>
            </div>

            {pushStatus === 'unsupported' && (
              <div style={{ fontSize:13, color:S.mu, background:S.s3, borderRadius:8, padding:'10px 14px' }}>
                Push notifications are not supported on this browser. Try Chrome on Android.
              </div>
            )}
            {pushStatus === 'denied' && (
              <div style={{ fontSize:13, color:S.err, background:S.errBg, border:`1px solid ${S.errBd}`, borderRadius:8, padding:'10px 14px' }}>
                ❌ Notifications are blocked. Go to your browser settings → Site Settings → Notifications → Allow starkteam.info
              </div>
            )}
            {pushStatus === 'granted' && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                <div style={{ fontSize:13, color:S.ok, fontWeight:600 }}>✅ Push notifications are ON</div>
                <button onClick={disablePush} disabled={pushLoading} style={{
                  padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer',
                  background:S.errBg, color:S.err, border:`1px solid ${S.errBd}`,
                }}>
                  {pushLoading ? 'Please wait…' : 'Turn Off'}
                </button>
              </div>
            )}
            {(pushStatus === 'unknown') && (
              <button onClick={enablePush} disabled={pushLoading} style={{
                width:'100%', padding:'11px', borderRadius:9, fontSize:14, fontWeight:700, cursor:'pointer',
                background: pushLoading ? S.mu : S.navy, color:'#fff', border:'none',
              }}>
                {pushLoading ? 'Requesting permission…' : '🔔 Enable Push Notifications'}
              </button>
            )}
          </div>

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

      {/* ── INSTALL APP ── */}
      {tab === 'app' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Running as installed standalone */}
          {isStandalone && (
            <div style={{ background:S.okBg, border:`1px solid ${S.okBd}`, borderRadius:10, padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:28 }}>✅</span>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:S.ok }}>You're using the installed app!</div>
                <div style={{ fontSize:13, color:S.ok, marginTop:2 }}>Stark Team is running as a full-screen app on this device.</div>
              </div>
            </div>
          )}

          {/* Quick-install button — Chrome is offering it right now */}
          {installable && !isStandalone && (
            <div style={{ background:S.navy, borderRadius:12, padding:20 }}>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginBottom:10 }}>
                Tap below to install Stark Team as an app on this device — no app store needed!
              </div>
              <button onClick={handleInstall} style={{
                width:'100%', padding:'14px', borderRadius:10, fontSize:15, fontWeight:700,
                background:S.gold, color:S.navy, border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}>
                📲 Install Stark Team App
              </button>
            </div>
          )}

          {/* Installed but via browser shortcut warning */}
          {installed && !isStandalone && (
            <div style={{ background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#92400E' }}>
              ⚠️ It looks like it was installed as a <strong>browser shortcut</strong> (opens inside Chrome, not full-screen).
              To get the real full-screen app, follow the steps below to re-install it properly.
            </div>
          )}

          {/* Android — manual steps, always shown */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:22, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🤖</div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:S.tx }}>Android Phone</div>
                <div style={{ fontSize:12, color:S.mu, marginTop:2 }}>Install in Chrome — takes 30 seconds</div>
              </div>
            </div>
            <div style={{ fontSize:13, color:S.tx2, marginBottom:14, lineHeight:1.6 }}>
              Open <strong>starkteam.info</strong> in <strong>Chrome</strong>, then:
            </div>
            {[
              'Tap the three-dot menu ⋮ in the top-right corner of Chrome',
              'Tap "Add to Home screen" or "Install app"',
              'Tap "Install" (NOT "Add shortcut" — that opens in browser)',
              'The Stark Team icon will appear on your home screen',
              'Tap it — it opens full-screen with no browser bar!',
            ].map((text, i) => (
              <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:12 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:S.navy, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0, marginTop:1 }}>{i+1}</div>
                <div style={{ fontSize:13, color:S.tx, paddingTop:6, lineHeight:1.5 }}>{text}</div>
              </div>
            ))}
            <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#1e40af', marginTop:4 }}>
              💡 If you installed it before as a shortcut: go to Chrome menu → Settings → Apps → Stark Team → Remove, then re-install using the steps above.
            </div>
          </div>

          {/* iOS */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:22, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:'#F5F3FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🍎</div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:S.tx }}>iPhone / iPad</div>
                <div style={{ fontSize:12, color:S.mu, marginTop:2 }}>Use Safari — not Chrome</div>
              </div>
            </div>
            <div style={{ background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#92400E', marginBottom:14 }}>
              ⚠️ <strong>Must use Safari.</strong> Chrome on iPhone does not support PWA install.
            </div>
            {[
              'Open starkteam.info in Safari',
              'Tap the Share ⬆️ button at the bottom of Safari',
              'Scroll and tap "Add to Home Screen"',
              'Tap "Add" — the icon appears on your home screen',
              'Open it — runs full-screen like a native app!',
            ].map((text, i) => (
              <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:12 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'#7C3AED', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0, marginTop:1 }}>{i+1}</div>
                <div style={{ fontSize:13, color:S.tx, paddingTop:6, lineHeight:1.5 }}>{text}</div>
              </div>
            ))}
          </div>

          {/* Alternative: PWABuilder APK */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:22, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>📦</div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:S.tx }}>Get an APK (Android Install File)</div>
                <div style={{ fontSize:12, color:S.mu, marginTop:2 }}>Alternative to Play Store — install directly</div>
              </div>
            </div>
            <div style={{ fontSize:13, color:S.tx2, lineHeight:1.7, marginBottom:14 }}>
              You can generate a real Android app file (APK) for Stark Team using the free <strong>PWABuilder</strong> tool — no Play Store needed.
            </div>
            {[
              'Visit pwabuilder.com on a computer',
              'Enter starkteam.info and click Start',
              'Click "Build My PWA" then choose Android',
              'Download the APK file',
              'Send it to your phone and open it to install',
            ].map((text, i) => (
              <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:S.ok, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, flexShrink:0, marginTop:1 }}>{i+1}</div>
                <div style={{ fontSize:13, color:S.tx, paddingTop:3, lineHeight:1.5 }}>{text}</div>
              </div>
            ))}
            <div style={{ background:S.s2, border:`1px solid ${S.bd}`, borderRadius:8, padding:'8px 12px', fontSize:12, color:S.mu, marginTop:6 }}>
              ℹ️ You may need to allow "Install from unknown sources" in your Android settings when installing the APK.
            </div>
          </div>

          {/* Benefits */}
          <div style={{ background:S.goldBg, border:`1px solid ${S.goldBd}`, borderRadius:10, padding:'14px 18px' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#92400E', marginBottom:8 }}>✨ Why install as an app?</div>
            {['Full-screen — no browser address bar', 'Faster loading', 'Looks like a native app', 'One tap from your home screen'].map(b => (
              <div key={b} style={{ fontSize:12, color:'#78350F', marginBottom:4 }}>• {b}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
