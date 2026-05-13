'use client'
import { useState } from 'react'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
  blue:'#2563EB', blueBg:'#EFF6FF', blueBd:'#BFDBFE',
}

const PRESETS = [
  { title:'🎯 Daily Goal Reminder', body:'Set your goal for today before 12:00 PM Nigeria time!' },
  { title:'📢 Team Announcement',   body:'Important update from the Stark Team admin. Check the app now.' },
  { title:'🏆 Leaderboard Updated', body:'The weekly leaderboard has been updated. See where you rank!' },
  { title:'✅ Activity Verified',   body:'One of your activities has just been verified by your leader.' },
]

export default function TestPushPage() {
  const [title,   setTitle]   = useState('')
  const [body,    setBody]    = useState('')
  const [target,  setTarget]  = useState<'self'|'all'>('self')
  const [sending, setSending] = useState(false)
  const [result,  setResult]  = useState<{ ok: boolean; msg: string } | null>(null)

  async function send() {
    if (!title.trim() || !body.trim()) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), target }),
      })
      const d = await res.json()
      if (res.ok) {
        setResult({ ok: true, msg: target === 'all'
          ? 'Push sent to ALL members with the app or browser notifications enabled!'
          : 'Push sent to your device only. Check your phone/browser.' })
      } else {
        setResult({ ok: false, msg: d.error ?? 'Failed to send' })
      }
    } catch {
      setResult({ ok: false, msg: 'Network error' })
    }
    setSending(false)
  }

  const input: React.CSSProperties = {
    width:'100%', padding:'10px 14px', fontSize:13, borderRadius:8,
    border:`1px solid ${S.bd}`, background:S.s1, color:S.tx,
    outline:'none', boxSizing:'border-box',
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>
          Test Push Notification
        </h1>
        <p style={{ fontSize:13, color:S.tx2 }}>
          Send a real push notification to verify it appears on phones and browsers.
          Use "My Device Only" first to test, then "All Members" for announcements.
        </p>
      </div>

      {/* Presets */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:S.mu, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:8 }}>
          Quick Presets
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {PRESETS.map(p => (
            <button key={p.title} onClick={() => { setTitle(p.title); setBody(p.body) }}
              style={{
                padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:600,
                border:`1px solid ${S.bd}`, background:S.s2, color:S.tx2,
                cursor:'pointer', whiteSpace:'nowrap',
              }}>
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:'20px', marginBottom:16 }}>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:700, color:S.mu, letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>
            Notification Title
          </label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. 🎯 Daily Goal Reminder"
            style={input} maxLength={100} />
        </div>

        <div style={{ marginBottom:18 }}>
          <label style={{ fontSize:12, fontWeight:700, color:S.mu, letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>
            Message Body
          </label>
          <textarea value={body} onChange={e => setBody(e.target.value)}
            placeholder="e.g. Set your goal for today before 12:00 PM!"
            rows={3}
            style={{ ...input, resize:'vertical', fontFamily:'inherit' }} maxLength={300} />
          <div style={{ fontSize:11, color:S.mu, marginTop:4, textAlign:'right' }}>{body.length}/300</div>
        </div>

        {/* Target selector */}
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12, fontWeight:700, color:S.mu, letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:8 }}>
            Send To
          </label>
          <div style={{ display:'flex', gap:10 }}>
            {([
              { value:'self', label:'📱 My Device Only', desc:'Test on your own phone/browser first' },
              { value:'all',  label:'📢 All Members',    desc:'Send to everyone — use carefully!' },
            ] as const).map(opt => (
              <button key={opt.value} onClick={() => setTarget(opt.value)}
                style={{
                  flex:1, padding:'12px 14px', borderRadius:10, cursor:'pointer',
                  border:`2px solid ${target === opt.value ? S.navy : S.bd}`,
                  background: target === opt.value ? S.navy : S.s2,
                  color: target === opt.value ? '#fff' : S.tx2,
                  textAlign:'left',
                }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:2 }}>{opt.label}</div>
                <div style={{ fontSize:11, opacity:0.7 }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={send}
          disabled={sending || !title.trim() || !body.trim()}
          style={{
            width:'100%', padding:'13px', borderRadius:10, fontSize:14, fontWeight:800,
            border:'none', cursor: sending || !title.trim() || !body.trim() ? 'not-allowed' : 'pointer',
            background: sending || !title.trim() || !body.trim() ? S.mu : S.navy,
            color:'#fff',
          }}>
          {sending ? 'Sending…' : target === 'all' ? '📢 Send to All Members' : '📱 Send to My Device'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div style={{
          padding:'14px 16px', borderRadius:10, fontSize:13, fontWeight:600,
          background: result.ok ? S.okBg : S.errBg,
          border:`1px solid ${result.ok ? S.okBd : S.errBd}`,
          color: result.ok ? S.ok : S.err,
          display:'flex', gap:10, alignItems:'center',
        }}>
          <span style={{ fontSize:18 }}>{result.ok ? '✅' : '❌'}</span>
          {result.msg}
        </div>
      )}

      {/* Tips */}
      <div style={{ marginTop:20, background:S.goldBg, border:`1px solid ${S.goldBd}`, borderRadius:10, padding:'14px 16px', fontSize:12, color:S.tx2, lineHeight:1.7 }}>
        <strong style={{ color:S.navy }}>Tips:</strong>
        <ul style={{ margin:'6px 0 0', paddingLeft:18 }}>
          <li>If the notification doesn&apos;t appear, check that you have enabled notifications in the app.</li>
          <li>On iPhone, you must install the app to home screen first, then enable notifications.</li>
          <li>Android APK users should receive notifications even when the app is closed.</li>
          <li>Browser PWA users must have the tab open or have granted persistent notification permission.</li>
        </ul>
      </div>
    </div>
  )
}
