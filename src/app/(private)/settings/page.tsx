'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'profile' | 'security' | 'notifications' | 'privacy'

const TABS: { key: Tab; label: string }[] = [
  { key: 'profile',       label: 'Profile'       },
  { key: 'security',      label: 'Security'       },
  { key: 'notifications', label: 'Notifications'  },
  { key: 'privacy',       label: 'Privacy'        },
]

const NOTIF_TOGGLES = [
  { key: 'notif_activity_verified', label: 'Activity verified',   desc: 'When a leader verifies your activity'         },
  { key: 'notif_activity_rejected', label: 'Activity rejected',   desc: 'When a leader rejects your activity'          },
  { key: 'notif_goal_reminder',     label: 'Goal reminders',      desc: 'Reminder when a goal deadline is approaching' },
  { key: 'notif_rank_change',       label: 'Rank changes',        desc: 'When your rank goes up or down'               },
  { key: 'notif_recognition',       label: 'Recognitions',        desc: 'When you receive a badge or recognition'      },
  { key: 'notif_system',            label: 'System announcements',desc: 'Platform updates and announcements'            },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 7, fontSize: 13,
  fontFamily: 'Outfit, sans-serif', background: 'var(--surface2)',
  border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600,
  letterSpacing: '0.10em', textTransform: 'uppercase' as const,
  color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif',
}

export default function SettingsPage() {
  const [tab, setTab]           = useState<Tab>('profile')
  const [profile, setProfile]   = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [bio, setBio]           = useState('')
  const [saving, setSaving]     = useState(false)
  const [message, setMessage]   = useState<{ text: string; ok: boolean } | null>(null)

  /* Notification toggles */
  const [toggles, setToggles]   = useState<Record<string, boolean>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('users').select('*').eq('id', user.id).single().then(({ data }) => {
        setProfile(data)
        setFullName(data?.full_name ?? '')
        setBio(data?.bio ?? '')
        /* init toggles from profile */
        const t: Record<string, boolean> = {}
        NOTIF_TOGGLES.forEach(n => { t[n.key] = data?.[n.key] ?? true })
        setToggles(t)
      })
    })
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMessage(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('users').update({ full_name: fullName, bio }).eq('id', user.id)
    setSaving(false)
    setMessage(error ? { text: 'Failed: ' + error.message, ok: false } : { text: 'Changes saved.', ok: true })
  }

  async function saveNotifications() {
    setSaving(true); setMessage(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('users').update(toggles).eq('id', user.id)
    setSaving(false)
    setMessage(error ? { text: 'Failed: ' + error.message, ok: false } : { text: 'Preferences saved.', ok: true })
  }

  async function changePassword() {
    const supabase = createClient()
    const email = profile?.email
    if (!email) return
    await supabase.auth.resetPasswordForEmail(email)
    setMessage({ text: 'Password reset email sent to ' + email, ok: true })
  }

  if (!profile) {
    return (
      <div className="p-6">
        <p style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>Loading…</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[680px] mx-auto">

      {/* ── HEADER ───────────────────────────────── */}
      <div className="mb-7">
        <h1 className="text-[22px] font-semibold"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
          Manage your account and preferences
        </p>
      </div>

      {/* ── TABS ─────────────────────────────────── */}
      <div className="flex gap-1 mb-7 p-1 rounded-[8px]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.key}
            onClick={() => { setTab(t.key); setMessage(null) }}
            className="flex-1 py-1.5 rounded-[6px] text-[12px] font-medium transition-all"
            style={{
              fontFamily: 'Outfit, sans-serif',
              background: tab === t.key ? 'var(--surface2)' : 'transparent',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              border: tab === t.key ? '1px solid var(--border)' : '1px solid transparent',
              cursor: 'pointer',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── STATUS MESSAGE ───────────────────────── */}
      {message && (
        <div className="rounded-[7px] px-4 py-3 mb-5 text-[12px]"
          style={{
            background: message.ok ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
            border: `1px solid ${message.ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
            color: message.ok ? '#22C55E' : '#EF4444',
            fontFamily: 'Outfit, sans-serif',
          }}>
          {message.text}
        </div>
      )}

      {/* ── PROFILE TAB ──────────────────────────── */}
      {tab === 'profile' && (
        <form onSubmit={saveProfile}>
          <div className="rounded-[12px] p-6 mb-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

            {/* Avatar */}
            <div className="flex items-center gap-5 mb-7 pb-6"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="hexagon w-16 h-16 flex items-center justify-center text-[18px] font-bold"
                style={{ background: 'var(--gold-dim)', color: 'var(--gold)', fontFamily: 'Cinzel, serif', flexShrink: 0 }}>
                {fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <p className="text-[14px] font-semibold"
                  style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                  {fullName || '—'}
                </p>
                <p className="rank-badge mt-0.5" style={{ fontSize: '9px' }}>
                  {profile.rank?.replace(/_/g, ' ')} · {profile.role}
                </p>
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                  Avatar auto-generated from initials
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label style={labelStyle}>Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Username</label>
                <input value={profile.username ?? ''} disabled style={{ ...inputStyle, opacity: 0.55 }} />
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
                  Username cannot be changed.
                </p>
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input value={profile.email ?? ''} disabled style={{ ...inputStyle, opacity: 0.55 }} />
              </div>
              <div>
                <label style={labelStyle}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                  style={{ ...inputStyle, resize: 'none' }}
                  placeholder="Tell your team a little about yourself…" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              style={{
                padding: '9px 24px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                fontFamily: 'Outfit, sans-serif', background: 'var(--gold)',
                color: '#07090F', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.65 : 1, boxShadow: '0 2px 10px rgba(201,168,76,0.25)',
              }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ── SECURITY TAB ─────────────────────────── */}
      {tab === 'security' && (
        <div className="rounded-[12px] p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="space-y-5">
            <div className="pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-[13px] font-semibold mb-1"
                style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                Password
              </p>
              <p className="text-[12px] mb-4" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                We'll send a password reset link to {profile.email}.
              </p>
              <button onClick={changePassword}
                style={{
                  padding: '8px 20px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  fontFamily: 'Outfit, sans-serif', background: 'var(--surface2)',
                  color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer',
                }}>
                Send Reset Email
              </button>
            </div>
            <div>
              <p className="text-[13px] font-semibold mb-1"
                style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                Email Address
              </p>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                {profile.email} — contact an admin to change your email.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ────────────────────── */}
      {tab === 'notifications' && (
        <>
          <div className="rounded-[12px] overflow-hidden mb-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {NOTIF_TOGGLES.map((n, i) => (
              <div key={n.key}
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: i < NOTIF_TOGGLES.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div>
                  <p className="text-[13px] font-medium"
                    style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                    {n.label}
                  </p>
                  <p className="text-[11px] mt-0.5"
                    style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                    {n.desc}
                  </p>
                </div>
                {/* Toggle */}
                <label className="toggle" style={{ marginLeft: 12 }}>
                  <input type="checkbox"
                    checked={toggles[n.key] ?? true}
                    onChange={e => setToggles(prev => ({ ...prev, [n.key]: e.target.checked }))} />
                  <span className="toggle-track" />
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={saveNotifications} disabled={saving}
              style={{
                padding: '9px 24px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                fontFamily: 'Outfit, sans-serif', background: 'var(--gold)',
                color: '#07090F', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.65 : 1,
              }}>
              {saving ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        </>
      )}

      {/* ── PRIVACY TAB ──────────────────────────── */}
      {tab === 'privacy' && (
        <div className="rounded-[12px] p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="space-y-5">
            {[
              { label: 'Profile visibility',   desc: 'Your profile is visible to all team members.' },
              { label: 'Activity history',      desc: 'Your activity submissions are visible to leaders and admins.' },
              { label: 'Leaderboard ranking',   desc: 'Your ranking is visible to all team members.' },
            ].map(row => (
              <div key={row.label} className="pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
                <p className="text-[13px] font-medium mb-1"
                  style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                  {row.label}
                </p>
                <p className="text-[12px]" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                  {row.desc}
                </p>
              </div>
            ))}
            <p className="text-[11px]" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
              Privacy settings are managed by your team admin. Contact your admin to request changes.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
