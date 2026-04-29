'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', navy2:'#1E3A5F', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  warn:'#D97706', err:'#DC2626', blue:'#2563EB', blueBg:'#EFF6FF',
}

const RANK_MAP: Record<string, string> = {
  distributor: 'Distributor', manager: 'Manager',
  senior_manager: 'Senior Manager', executive_manager: 'Executive', director: 'Director',
}

const BADGE_DEFS = [
  { id:'first_activity', label:'First Activity',   icon:'⚡', color:'#D4A017' },
  { id:'verified_10',    label:'10 Verified',       icon:'✓',  color:'#16A34A' },
  { id:'top_10',         label:'Top 10 Rank',       icon:'🏆', color:'#2563EB' },
  { id:'goal_setter',    label:'Goal Setter',       icon:'◎',  color:'#7C3AED' },
  { id:'streak_7',       label:'7-Day Streak',      icon:'🔥', color:'#DC2626' },
]

export default function ProfilePage() {
  const [profile,    setProfile]    = useState<any>(null)
  const [stats,      setStats]      = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [editing,    setEditing]    = useState(false)
  const [form,       setForm]       = useState({ full_name:'', username:'', bio:'' })
  const [saving,     setSaving]     = useState(false)
  const [msg,        setMsg]        = useState('')
  const [loading,    setLoading]    = useState(true)
  const [uploading,  setUploading]  = useState(false)
  const [inviteUrl,  setInviteUrl]  = useState('')
  const [inviteExp,  setInviteExp]  = useState('')
  const [copiedInv,  setCopiedInv]  = useState(false)
  const [regenLoading, setRegenLoading] = useState(false)
  const [showQrModal,  setShowQrModal]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [profRes, actsRes, goalsRes, lbRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('activities').select('status,title,activity_type,submitted_at').eq('user_id', user.id).order('submitted_at',{ascending:false}).limit(5),
      supabase.from('goals').select('status').eq('user_id', user.id),
      supabase.from('leaderboard_snapshots').select('rank_position').eq('user_id', user.id).eq('period','monthly').order('snapshot_date',{ascending:false}).limit(1).maybeSingle(),
    ])
    const prof  = profRes.data
    const acts  = actsRes.data ?? []
    const verified  = acts.filter((a: any) => a.status === 'verified').length
    const goalsDone = (goalsRes.data ?? []).filter((g: any) => g.status === 'completed').length
    const rate  = acts.length > 0 ? Math.round((verified / acts.length) * 100) : 0
    setProfile(prof)
    setStats({ total: acts.length, verified, rate, goalsDone, lb: lbRes.data?.rank_position ?? null })
    setActivities(acts)
    setForm({ full_name: prof?.full_name ?? '', username: prof?.username ?? '', bio: prof?.bio ?? '' })
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProfile()
    // Load personal invite link
    fetch('/api/my-invite')
      .then(r => r.json())
      .then(d => { if (d.invite_url) { setInviteUrl(d.invite_url); setInviteExp(d.expires_at) } })
      .catch(() => {})
  }, [loadProfile])

  async function handleSave() {
    setSaving(true); setMsg('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('users').update({ full_name: form.full_name, username: form.username, bio: form.bio }).eq('id', user.id)
    if (error) setMsg(error.message)
    else { setProfile((p: any) => ({ ...p, ...form })); setEditing(false); setMsg('Profile updated!') }
    setSaving(false)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setMsg('Image must be under 5MB'); return }
    setUploading(true); setMsg('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }
    const ext  = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) {
      setMsg('Upload failed: ' + upErr.message + '. Check that the avatars storage bucket exists and is public.')
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const avatar_url = urlData.publicUrl + '?t=' + Date.now()
    const { error: updateErr } = await supabase.from('users').update({ avatar_url }).eq('id', user.id)
    if (updateErr) { setMsg('Photo uploaded but profile update failed: ' + updateErr.message); setUploading(false); return }
    setProfile((p: any) => ({ ...p, avatar_url }))
    setMsg('Photo updated!')
    setUploading(false)
  }

  async function regenInvite() {
    setRegenLoading(true)
    const r = await fetch('/api/my-invite', { method:'POST' })
    const d = await r.json()
    if (d.invite_url) { setInviteUrl(d.invite_url); setInviteExp(d.expires_at) }
    setRegenLoading(false)
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopiedInv(true)
    setTimeout(() => setCopiedInv(false), 2500)
  }

  function emailInvite() {
    const subject = encodeURIComponent('Join my team on Stark Team!')
    const body = encodeURIComponent(
      `Hi!\n\nI'd like to invite you to join my team on Stark Team.\n\nClick this link to create your account:\n${inviteUrl}\n\nSee you inside!`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:`3px solid ${S.bd}`, borderTop:`3px solid ${S.navy}`, animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!profile) return null

  const initials   = profile.full_name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2) ?? '??'
  const rankLabel  = RANK_MAP[profile.rank] ?? (profile.rank ?? 'Member').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  const badgesEarned = BADGE_DEFS.filter(b => {
    if (b.id === 'first_activity') return (stats?.total ?? 0) >= 1
    if (b.id === 'verified_10')    return (stats?.verified ?? 0) >= 10
    if (b.id === 'top_10')         return stats?.lb && stats.lb <= 10
    if (b.id === 'goal_setter')    return (stats?.goalsDone ?? 0) >= 1
    return false
  })

  const statusStyle = (s: string): React.CSSProperties => ({
    fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20,
    background: s==='verified' ? S.okBg : s==='pending' ? S.blueBg : '#FEF2F2',
    color:      s==='verified' ? S.ok   : s==='pending' ? S.blue   : S.err,
    border:    `1px solid ${s==='verified' ? S.okBd : s==='pending' ? '#BFDBFE' : '#FCA5A5'}`,
  })

  const qrSrc = inviteUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(inviteUrl)}`
    : ''

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

      {/* QR modal */}
      {showQrModal && inviteUrl && (
        <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setShowQrModal(false)}>
          <div style={{ background:'#fff', borderRadius:18, padding:32, maxWidth:320, width:'90%', textAlign:'center', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:15, fontWeight:800, color:S.navy, marginBottom:4 }}>My Team Invite QR</div>
            <div style={{ fontSize:12, color:S.tx2, marginBottom:18 }}>Scan to join your downline</div>
            <div style={{ background:'#fff', borderRadius:12, padding:10, display:'inline-block', border:`2px solid ${S.goldBd}` }}>
              <img src={qrSrc} alt="My QR Code" width={220} height={220} style={{ display:'block' }} />
            </div>
            <div style={{ marginTop:14, fontSize:11, color:S.mu, wordBreak:'break-all', fontFamily:"'JetBrains Mono',monospace", lineHeight:1.5 }}>
              {inviteUrl.slice(0,50)}…
            </div>
            <div style={{ marginTop:16, display:'flex', gap:8, justifyContent:'center' }}>
              <a href={qrSrc} download="my-team-invite-qr.png" target="_blank" rel="noreferrer"
                style={{ padding:'9px 20px', borderRadius:8, fontSize:12, fontWeight:700, background:S.navy, color:'#fff', textDecoration:'none' }}>
                ⬇️ Download QR
              </a>
              <button onClick={() => setShowQrModal(false)} style={{ padding:'9px 18px', borderRadius:8, fontSize:12, fontWeight:600, background:'#F1F5F9', color:S.tx2, border:`1px solid ${S.bd}`, cursor:'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero banner ── */}
      <div style={{ background:S.navy, borderRadius:12, padding:'28px 28px 24px', marginBottom:18, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(212,160,23,0.08)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'center', gap:18 }}>
          {/* Avatar — click to upload */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <div
              onClick={() => fileRef.current?.click()}
              title="Click to change photo"
              style={{
                width:72, height:72, borderRadius:'50%', overflow:'hidden',
                background:S.gold, display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:26, fontWeight:800, color:S.navy,
                cursor:'pointer', border:`3px solid rgba(212,160,23,0.5)`,
                flexShrink:0, position:'relative',
              }}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              ) : null}
              {!profile.avatar_url && initials}
              {/* Overlay */}
              <div style={{
                position:'absolute', inset:0, background:'rgba(0,0,0,0.35)',
                display:'flex', alignItems:'center', justifyContent:'center',
                opacity:0, transition:'opacity .2s',
                fontSize:18,
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity='1')}
                onMouseLeave={e => (e.currentTarget.style.opacity='0')}
              >📷</div>
            </div>
            {uploading && (
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(15,28,46,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:20, height:20, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', animation:'spin .8s linear infinite' }} />
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display:'none' }} />
          </div>

          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:4 }}>{profile.full_name}</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)' }}>@{profile.username} · {rankLabel}</div>
            {profile.bio && <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>{profile.bio}</div>}
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:6 }}>Click photo to change picture</div>
          </div>

          <button onClick={() => setEditing(!editing)} style={{
            padding:'8px 16px', borderRadius:8, alignSelf:'flex-start',
            background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)',
            color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer',
          }}>{editing ? 'Cancel' : 'Edit Profile'}</button>
        </div>

        {/* Stats row */}
        <div style={{ display:'flex', gap:24, marginTop:22, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          {[
            { label:'Verified Acts', value: stats?.verified ?? 0 },
            { label:'Verified Rate', value: `${stats?.rate ?? 0}%` },
            { label:'Leaderboard',   value: stats?.lb ? `#${stats.lb}` : '—' },
            { label:'Goals Done',    value: stats?.goalsDone ?? 0 },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize:20, fontWeight:800, color:S.gold, fontFamily:"'JetBrains Mono',monospace" }}>{s.value}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Edit form ── */}
      {editing && (
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:20, marginBottom:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:16 }}>Edit Profile</div>
          {msg && <div style={{ marginBottom:12, fontSize:13, color:msg.includes('!')?S.ok:S.err }}>{msg}</div>}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            {([['Full Name','full_name'],['Username','username']] as [string,string][]).map(([label, key]) => (
              <div key={key}>
                <div style={{ fontSize:11, fontWeight:600, color:S.tx2, marginBottom:6 }}>{label}</div>
                <input value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:`1px solid ${S.bd}`, background:S.s2, fontSize:13, color:S.tx }} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:600, color:S.tx2, marginBottom:6 }}>Bio</div>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3}
              style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:`1px solid ${S.bd}`, background:S.s2, fontSize:13, color:S.tx, resize:'vertical' }}
            />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleSave} disabled={saving} style={{ padding:'9px 20px', borderRadius:8, background:S.navy, color:'#fff', fontSize:13, fontWeight:600, border:'none', cursor:'pointer' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={() => setEditing(false)} style={{ padding:'9px 20px', borderRadius:8, background:S.s3, color:S.tx2, fontSize:13, fontWeight:600, border:`1px solid ${S.bd}`, cursor:'pointer' }}>
              Discard
            </button>
          </div>
        </div>
      )}

      {/* ── My Invite Link ── */}
      <div style={{ background:S.goldBg, border:`1px solid ${S.goldBd}`, borderRadius:12, padding:20, marginBottom:18, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:S.navy }}>🔗 My Invite Link</div>
            <div style={{ fontSize:12, color:S.tx2, marginTop:2 }}>
              Share this link to invite people into your downline
              {inviteExp && <span style={{ color:S.mu }}> · expires {new Date(inviteExp).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>}
            </div>
          </div>
          <button onClick={regenInvite} disabled={regenLoading} style={{
            padding:'6px 14px', borderRadius:7, fontSize:12, fontWeight:600,
            background:'rgba(15,28,46,0.08)', color:S.navy, border:`1px solid rgba(15,28,46,0.15)`,
            cursor:'pointer',
          }}>
            {regenLoading ? '…' : '↺ New Link'}
          </button>
        </div>

        {inviteUrl ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'start' }}>
            <div>
              <div style={{
                background:'rgba(255,255,255,0.7)', border:`1px solid ${S.goldBd}`, borderRadius:8,
                padding:'10px 14px', fontSize:11, color:S.navy,
                fontFamily:"'JetBrains Mono',monospace", wordBreak:'break-all', marginBottom:12, lineHeight:1.6,
              }}>
                {inviteUrl}
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button onClick={copyInvite} style={{ padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:700, background: copiedInv ? S.ok : S.navy, color:'#fff', border:'none', cursor:'pointer' }}>
                  {copiedInv ? '✓ Copied!' : '📋 Copy Link'}
                </button>
                <button onClick={emailInvite} style={{ padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:700, background:'transparent', color:S.navy, border:`1px solid ${S.goldBd}`, cursor:'pointer' }}>
                  ✉️ Email
                </button>
                <button onClick={() => setShowQrModal(true)} style={{ padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:700, background:'#EFF6FF', color:'#2563EB', border:'1px solid #BFDBFE', cursor:'pointer' }}>
                  📱 My QR Code
                </button>
              </div>
            </div>
            {/* Mini QR preview */}
            <div style={{ cursor:'pointer', flexShrink:0 }} onClick={() => setShowQrModal(true)} title="Click to enlarge">
              <div style={{ background:'#fff', borderRadius:8, padding:5, border:`1px solid ${S.goldBd}`, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
                <img src={qrSrc} alt="QR" width={72} height={72} style={{ display:'block' }} />
              </div>
              <div style={{ fontSize:10, color:S.mu, textAlign:'center', marginTop:4 }}>Tap to enlarge</div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize:13, color:S.mu }}>Loading your invite link…</div>
        )}
      </div>

      {/* ── Main grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
        {/* Left */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Recent Activities */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:14 }}>Recent Activities</div>
            {activities.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:S.mu, fontSize:13 }}>No activities yet</div>
            ) : activities.map((a: any, i: number, arr: any[]) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:i<arr.length-1?`1px solid ${S.bd}`:'none' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:a.status==='verified'?S.ok:a.status==='pending'?S.blue:S.err, flexShrink:0 }} />
                <span style={{ flex:1, fontSize:13, fontWeight:500, color:S.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</span>
                <span style={{ fontSize:11, color:S.mu, marginRight:8, flexShrink:0 }}>
                  {new Date(a.submitted_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                </span>
                <span style={statusStyle(a.status)}>{a.status.charAt(0).toUpperCase()+a.status.slice(1)}</span>
              </div>
            ))}
          </div>

          {/* Badges */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:14 }}>Badges</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
              {BADGE_DEFS.map(b => {
                const earned = badgesEarned.some(e => e.id === b.id)
                return (
                  <div key={b.id} style={{
                    display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
                    borderRadius:8, border:`1px solid ${earned ? b.color+'40' : S.bd}`,
                    background: earned ? b.color+'10' : S.s3, opacity: earned ? 1 : 0.5,
                  }}>
                    <span style={{ fontSize:16 }}>{b.icon}</span>
                    <span style={{ fontSize:12, fontWeight:600, color: earned ? b.color : S.mu }}>{b.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Rank progress */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', borderTop:`3px solid ${S.gold}` }}>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:14 }}>Rank Progress</div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ width:44, height:44, borderRadius:8, background:S.goldBg, border:`1px solid ${S.goldBd}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:S.gold }}>
                {initials.slice(0,1)}
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:S.tx }}>{rankLabel}</div>
                <div style={{ fontSize:11, color:S.mu }}>Current rank</div>
              </div>
            </div>
            <div style={{ height:6, background:S.s3, borderRadius:3, overflow:'hidden', marginBottom:6 }}>
              <div style={{ width:`${Math.min(100, stats?.rate ?? 0)}%`, height:'100%', background:S.gold, borderRadius:3 }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:11, color:S.mu }}>Verification rate</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:S.gold, fontWeight:600 }}>{stats?.rate ?? 0}%</span>
            </div>
          </div>

          {/* Account info */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:12 }}>Account Info</div>
            {[
              { label:'Role',         value: (profile.role ?? 'member').replace(/\b\w/g, (c: string) => c.toUpperCase()) },
              { label:'Member since', value: new Date(profile.created_at).toLocaleDateString('en-US',{month:'long',year:'numeric'}) },
              { label:'Status',       value: profile.is_active ? 'Active' : 'Inactive' },
            ].map((r, i, arr) => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:i<arr.length-1?`1px solid ${S.bd}`:'none' }}>
                <span style={{ fontSize:12, color:S.tx2 }}>{r.label}</span>
                <span style={{ fontSize:12, fontWeight:600, color:S.tx }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
