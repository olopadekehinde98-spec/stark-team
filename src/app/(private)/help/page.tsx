'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
  blue:'#2563EB', blueBg:'#EFF6FF', blueBd:'#BFDBFE',
  bd2:'#CBD5E1',
  warn:'#D97706', warnBg:'#FFFBEB', warnBd:'#FCD34D',
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, overflow:'hidden', marginBottom:14, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:'100%', display:'flex', alignItems:'center', gap:12, padding:'16px 20px',
        background:'none', border:'none', cursor:'pointer', textAlign:'left',
      }}>
        <span style={{ fontSize:20 }}>{icon}</span>
        <span style={{ fontSize:15, fontWeight:700, color:S.tx, flex:1 }}>{title}</span>
        <span style={{ fontSize:18, color:S.mu }}>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div style={{ padding:'0 20px 20px', borderTop:`1px solid ${S.bd}` }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginTop:12 }}>
      <div style={{ width:24, height:24, borderRadius:'50%', background:S.navy, color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
        {n}
      </div>
      <p style={{ fontSize:13, color:S.tx2, lineHeight:1.7, margin:0 }}>{text}</p>
    </div>
  )
}

function Alert({ type, children }: { type: 'ok' | 'warn' | 'err' | 'blue'; children: React.ReactNode }) {
  const m = {
    ok:   { bg:S.okBg,   bd:S.okBd,   color:S.ok,   icon:'✅' },
    warn: { bg:S.warnBg, bd:S.warnBd, color:S.warn, icon:'⚠️' },
    err:  { bg:S.errBg,  bd:S.errBd,  color:S.err,  icon:'❌' },
    blue: { bg:S.blueBg, bd:S.blueBd, color:S.blue, icon:'ℹ️' },
  }[type]
  return (
    <div style={{ background:m.bg, border:`1px solid ${m.bd}`, borderRadius:8, padding:'10px 14px', marginTop:12, fontSize:13, color:m.color, display:'flex', gap:8, alignItems:'flex-start', lineHeight:1.6 }}>
      <span>{m.icon}</span><span>{children}</span>
    </div>
  )
}

export default function HelpPage() {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
          <div style={{ width:40, height:40, background:S.navy, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:S.gold }}>ST</div>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:2 }}>Stark Team — Platform Guide</h1>
            <p style={{ fontSize:13, color:S.mu }}>Everything you need to know to use this platform</p>
          </div>
        </div>
      </div>

      {/* What is Stark Team */}
      <Section title="What is Stark Team?" icon="🏆">
        <p style={{ fontSize:13, color:S.tx2, lineHeight:1.8, marginTop:14 }}>
          <strong style={{ color:S.tx }}>Stark Team</strong> is a private performance tracking platform for Neolife distributors and leaders.
          It helps you track sales activities, grow your team through invite links, verify member performance, and compete on the leaderboard.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginTop:14 }}>
          {[
            { icon:'📋', title:'Log Activities', desc:'Record every sales call, meeting, and recruitment' },
            { icon:'👥', title:'Build Your Team', desc:'Invite members with your personal QR code / link' },
            { icon:'✅', title:'Get Verified', desc:'Leaders verify your activities to earn full points' },
            { icon:'🏅', title:'Leaderboard', desc:'Compete with teammates and track your rank progress' },
          ].map(c => (
            <div key={c.title} style={{ background:S.s2, border:`1px solid ${S.bd}`, borderRadius:8, padding:'12px 14px' }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{c.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:S.tx, marginBottom:2 }}>{c.title}</div>
              <div style={{ fontSize:12, color:S.mu }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* How to Sign In */}
      <Section title="How to Sign In" icon="🔐">
        <Step n={1} text="Open stark-team.vercel.app in your browser." />
        <Step n={2} text='You will see the login page. Enter your email address and password, then click "Sign In".' />
        <Step n={3} text="You will be taken straight to your Dashboard. If you see an error, double-check your email and password — both must match exactly what you registered with." />
        <Alert type="blue">Don't have an account? You must receive an invite link from your team leader to register. You cannot sign up without one.</Alert>
      </Section>

      {/* How to Sign Out */}
      <Section title="How to Sign Out" icon="🚪">
        <Step n={1} text='Click your profile picture or initials in the top-right corner of any page.' />
        <Step n={2} text='Select "Sign Out" from the menu.' />
        <Step n={3} text="You will be returned to the login page. Your session is fully closed." />
        <div style={{ marginTop:16 }}>
          <button onClick={handleSignOut} disabled={signingOut} style={{
            padding:'9px 20px', borderRadius:8, fontSize:13, fontWeight:700,
            background: signingOut ? S.mu : S.errBg, color: signingOut ? '#fff' : S.err,
            border:`1px solid ${S.errBd}`, cursor: signingOut ? 'not-allowed' : 'pointer',
          }}>
            {signingOut ? 'Signing out…' : '🚪 Sign Out Now'}
          </button>
        </div>
      </Section>

      {/* Roles explained */}
      <Section title="Roles & Ranks Explained" icon="🎖️">
        <div style={{ marginTop:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:S.mu, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Roles</div>
          {[
            { role:'Member',  desc:'Standard team member. Can log activities, view downline, see leaderboard.' },
            { role:'Leader',  desc:'Can verify member activities in their downline. Has access to the Verify Queue.' },
            { role:'Admin',   desc:'Full access. Manages users, ranks, invite links, announcements, and settings.' },
          ].map(r => (
            <div key={r.role} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:`1px solid ${S.bd}` }}>
              <span style={{ fontSize:12, fontWeight:700, color:S.navy, background:S.s3, border:`1px solid ${S.bd}`, padding:'2px 10px', borderRadius:20, height:'fit-content', whiteSpace:'nowrap' }}>{r.role}</span>
              <span style={{ fontSize:13, color:S.tx2, lineHeight:1.6 }}>{r.desc}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:S.mu, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Ranks (lowest → highest)</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {['Distributor','Manager','Senior Manager','Executive','Director'].map((r, i) => (
              <div key={r} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:12, background:S.goldBg, border:`1px solid ${S.goldBd}`, color:S.gold, padding:'3px 10px', borderRadius:20, fontWeight:600 }}>{r}</span>
                {i < 4 && <span style={{ color:S.bd2, fontSize:14 }}>→</span>}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Common problems */}
      <Section title="Common Issues & How to Fix Them" icon="🛠️">
        {[
          {
            q: 'I can\'t log in — it says "Invalid login credentials"',
            a: 'Your email or password is wrong. Try the "Forgot password?" link on the login page. A reset link will be sent to your email.',
          },
          {
            q: 'My invite link says "Invalid Invite" or "Expired"',
            a: 'Invite links expire after a set number of days, or can only be used once. Ask your team leader to generate a new invite link for you.',
          },
          {
            q: 'My activity is stuck on "Pending"',
            a: 'Your leader needs to verify it in the Verify Queue. If it stays pending for more than 14 days, it automatically becomes "Unverified" which scores 0.2× points instead of full points.',
          },
          {
            q: 'I don\'t see my downline in the Team Tree',
            a: 'New members must sign up using YOUR invite link for them to appear in your tree. Share your personal invite link from your Profile page.',
          },
          {
            q: 'Password reset link goes to wrong page',
            a: 'Make sure you are opening the reset link on a device with internet access to stark-team.vercel.app. Copy the full link from your email if clicking it doesn\'t work.',
          },
          {
            q: 'My profile photo isn\'t showing',
            a: 'Go to your Profile page and click on your avatar circle to upload a photo. Supported formats: JPG, PNG. Max size 5MB.',
          },
        ].map((item, i) => (
          <div key={i} style={{ marginTop:16, paddingTop: i > 0 ? 16 : 0, borderTop: i > 0 ? `1px solid ${S.bd}` : 'none' }}>
            <div style={{ fontSize:13, fontWeight:700, color:S.tx, marginBottom:6 }}>❓ {item.q}</div>
            <div style={{ fontSize:13, color:S.tx2, lineHeight:1.7 }}>→ {item.a}</div>
          </div>
        ))}
      </Section>

      {/* Goal time rules */}
      <Section title="Daily Goal Rules — When to Set & Submit" icon="🎯">
        <Alert type="warn">
          Goals must be written <strong>between 5:00 AM and 12:00 PM Nigeria time (WAT)</strong> every day.
          Once it is 12:00 PM, the Create Goal button locks until the next morning at 5:00 AM.
        </Alert>
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:S.mu, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>How it works</div>
          {[
            { icon:'⏰', title:'5:00 AM — Window opens', desc:'You can create your goal for the day starting from 5:00 AM Nigeria time.' },
            { icon:'✍️', title:'Write your goal clearly', desc:'Your goal title should describe exactly what you plan to achieve today. Be specific.' },
            { icon:'🔒', title:'12:00 PM — Window closes', desc:'At noon (12:00 PM WAT) the window closes. You cannot create a new goal until the next morning.' },
            { icon:'📋', title:'Submit via Activities', desc:'When you complete the goal, submit it through the Activities page. Link the activity to your written goal — it will be automatically marked as complete.' },
          ].map(item => (
            <div key={item.title} style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:`1px solid ${S.bd}` }}>
              <span style={{ fontSize:20, flexShrink:0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:S.tx, marginBottom:3 }}>{item.title}</div>
                <div style={{ fontSize:13, color:S.tx2, lineHeight:1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <Alert type="blue">
          <strong>Daily Reminder:</strong> Between 5:00 AM and 12:00 PM, a gold banner appears at the top of every page reminding you to set your goal.
          This banner cannot be dismissed — it disappears automatically at noon. It is silent (no sound).
        </Alert>
      </Section>

      {/* Activity & Goal link */}
      <Section title="Activities Must Match Your Written Goals" icon="📋">
        <p style={{ fontSize:13, color:S.tx2, lineHeight:1.8, marginTop:14 }}>
          When you submit an activity, you should <strong style={{ color:S.tx }}>link it to one of your active goals</strong>.
          This is how your performance is tracked correctly.
        </p>
        {[
          { q: 'Why must I link an activity to a goal?', a: 'Your goal is your commitment for the day. Your activity is the proof that you completed it. Linking them closes the loop — goal written → work done → goal marked complete.' },
          { q: 'What happens when I submit an activity linked to a goal?', a: 'The goal is automatically marked as Completed. You do not need to manually close the goal.' },
          { q: 'Can I submit an activity without a goal?', a: 'Yes, but it is strongly encouraged to always have a written goal first. Goals set the intention; activities prove the work.' },
        ].map((item, i) => (
          <div key={i} style={{ marginTop:16, paddingTop: i > 0 ? 16 : 0, borderTop: i > 0 ? `1px solid ${S.bd}` : 'none' }}>
            <div style={{ fontSize:13, fontWeight:700, color:S.tx, marginBottom:6 }}>❓ {item.q}</div>
            <div style={{ fontSize:13, color:S.tx2, lineHeight:1.7 }}>→ {item.a}</div>
          </div>
        ))}
      </Section>

      {/* Admin override */}
      <Section title="Admin Override (Admins Only)" icon="🛡️">
        <p style={{ fontSize:13, color:S.tx2, lineHeight:1.8, marginTop:14 }}>
          Admins have access to the <strong style={{ color:S.tx }}>Override Panel</strong> under the Admin menu.
          This allows the admin to correct any goal or activity record — including their own.
        </p>
        <div style={{ marginTop:10 }}>
          {[
            { action:'Reject a Goal',      desc:'Marks any accepted/active goal as Rejected. Use when a goal was approved by mistake or does not meet standards.' },
            { action:'Reset to Pending',   desc:'Returns a goal or activity back to Pending status so it can be reviewed or re-submitted.' },
            { action:'Mark Goal Complete', desc:'Force-completes a goal even if no activity has been submitted against it yet.' },
            { action:'Reject an Activity', desc:'Rejects a pending or verified activity submitted by any leader, including the admin\'s own submissions.' },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:`1px solid ${S.bd}` }}>
              <span style={{ fontSize:12, fontWeight:700, color:S.navy, background:S.s3, border:`1px solid ${S.bd}`, padding:'2px 10px', borderRadius:20, height:'fit-content', whiteSpace:'nowrap' }}>{item.action}</span>
              <span style={{ fontSize:13, color:S.tx2, lineHeight:1.6 }}>{item.desc}</span>
            </div>
          ))}
        </div>
        <Alert type="err">
          Override actions are immediate and permanent. They do not notify the affected user automatically.
          Admins should use override only when there is a genuine reason.
        </Alert>
      </Section>

      {/* Navigation guide */}
      <Section title="Quick Navigation Guide" icon="🗺️">
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
          {[
            { path:'/dashboard',   icon:'📊', label:'Dashboard',   desc:'Your overview — stats, recent activities, notifications' },
            { path:'/activities',  icon:'📋', label:'Activities',  desc:'Log, view and edit your field reports' },
            { path:'/team',        icon:'👥', label:'Team Tree',   desc:'See everyone you invited and their recruits' },
            { path:'/leaderboard', icon:'🏅', label:'Leaderboard', desc:'Rankings for the whole team' },
            { path:'/profile',     icon:'👤', label:'Profile',     desc:'Edit your info, photo, and get your invite link' },
            { path:'/goals',       icon:'🎯', label:'Goals',       desc:'Set and track monthly/weekly targets' },
            { path:'/verify',      icon:'✅', label:'Verify Queue',desc:'(Leaders only) Approve or reject member activities' },
          ].map(nav => (
            <a key={nav.path} href={nav.path} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:S.s2, border:`1px solid ${S.bd}`, borderRadius:8, textDecoration:'none' }}>
              <span style={{ fontSize:18 }}>{nav.icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:S.tx }}>{nav.label}</div>
                <div style={{ fontSize:11, color:S.mu }}>{nav.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </Section>

      {/* Install App */}
      <Section title="Install Stark Team as an App on Your Phone" icon="📲">
        <Alert type="blue">
          Stark Team is a Progressive Web App (PWA) — you can add it to your phone's home screen so it opens like a real app, full-screen with no browser bar.
        </Alert>

        {/* Android */}
        <div style={{ marginTop:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <span style={{ fontSize:22 }}>🤖</span>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx }}>Android Phone (Chrome)</div>
          </div>
          <Step n={1} text="Open starkteam.info in Google Chrome on your Android phone." />
          <Step n={2} text="Tap the three-dot menu ⋮ in the top-right corner of Chrome." />
          <Step n={3} text='Tap "Add to Home screen" (or "Install app" — they do the same thing).' />
          <Step n={4} text='Tap "Add" or "Install" to confirm. The Stark Team icon will appear on your home screen.' />
          <Step n={5} text="Tap the icon on your home screen — the app opens full-screen, like a real app!" />
          <Alert type="ok">You can also tap the install banner that sometimes appears automatically at the bottom of the screen.</Alert>
        </div>

        {/* iOS */}
        <div style={{ marginTop:22, paddingTop:18, borderTop:`1px solid ${S.bd}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <span style={{ fontSize:22 }}>🍎</span>
            <div style={{ fontSize:14, fontWeight:700, color:S.tx }}>iPhone / iPad (iOS)</div>
          </div>
          <Alert type="warn">You MUST use Safari on iOS — Chrome on iPhone does not support adding apps to home screen.</Alert>
          <Step n={1} text="Open starkteam.info in Safari (not Chrome)." />
          <Step n={2} text="Tap the Share button at the bottom centre of the screen — it looks like a box with an arrow pointing up ⬆️." />
          <Step n={3} text='Scroll down the share menu and tap "Add to Home Screen".' />
          <Step n={4} text='Tap "Add" in the top-right corner.' />
          <Step n={5} text="The Stark Team icon will appear on your home screen. Tap it to open the app full-screen!" />
        </div>

        <div style={{ background:S.goldBg, border:`1px solid ${S.goldBd}`, borderRadius:8, padding:'12px 16px', marginTop:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#92400E', marginBottom:6 }}>✨ Why install it?</div>
          {['Opens full-screen — no browser address bar', 'Works much faster once installed', 'Feels and looks just like a native app', 'One tap from your home screen'].map(b => (
            <div key={b} style={{ fontSize:12, color:'#78350F', marginBottom:3 }}>• {b}</div>
          ))}
        </div>
      </Section>

      {/* Contact */}
      <Section title="Need More Help?" icon="📞">
        <p style={{ fontSize:13, color:S.tx2, lineHeight:1.8, marginTop:14 }}>
          This is a private platform managed by <strong style={{ color:S.tx }}>Stark Team administration</strong>.
          If you have a problem that isn't covered here:
        </p>
        <div style={{ marginTop:10 }}>
          <div style={{ fontSize:13, color:S.tx2, marginTop:8 }}>📧 Contact your team leader directly</div>
          <div style={{ fontSize:13, color:S.tx2, marginTop:8 }}>📱 Share your issue with a screenshot</div>
          <div style={{ fontSize:13, color:S.tx2, marginTop:8 }}>🔄 Try signing out and back in to refresh your session</div>
        </div>
        <Alert type="blue">Always keep your login details safe. Never share your password with anyone — not even your team leader.</Alert>
      </Section>

      <div style={{ textAlign:'center', padding:'24px 0', fontSize:12, color:S.mu }}>
        Stark Team Platform · Built for Neolife Distributors · Version 1.0
      </div>
    </div>
  )
}
