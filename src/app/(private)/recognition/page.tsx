import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
}

const BADGE: Record<string, { color:string; bg:string; bd:string; icon:string; label:string }> = {
  activity:   { color:'#2563EB', bg:'#EFF6FF', bd:'#BFDBFE', icon:'📋', label:'Activity'   },
  goal:       { color:'#16A34A', bg:'#F0FDF4', bd:'#86EFAC', icon:'🎯', label:'Goal'       },
  rank:       { color:'#D4A017', bg:'#FEF9EC', bd:'#F5D87A', icon:'⬆️', label:'Rank'       },
  leadership: { color:'#7C3AED', bg:'#F5F3FF', bd:'#DDD6FE', icon:'👑', label:'Leadership' },
  custom:     { color:'#EA580C', bg:'#FFF7ED', bd:'#FDBA74', icon:'🏅', label:'Special'    },
}

function initials(name: string) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
}

const PALETTES = [
  { bg:'#EFF6FF', tx:'#2563EB', bd:'#BFDBFE' },
  { bg:'#F0FDF4', tx:'#16A34A', bd:'#86EFAC' },
  { bg:'#F5F3FF', tx:'#7C3AED', bd:'#DDD6FE' },
  { bg:'#FEF9EC', tx:'#D4A017', bd:'#F5D87A' },
  { bg:'#FFF7ED', tx:'#EA580C', bd:'#FDBA74' },
]

export default async function RecognitionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('users').select('role,rank').eq('id', user.id).single()

  const [myBadgesRes, wallRes] = await Promise.all([
    supabase
      .from('recognitions')
      .select('id,title,message,badge_type,created_at,is_auto')
      .eq('recipient_id', user.id)
      .eq('is_revoked', false)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('recognitions')
      .select('id,title,message,badge_type,created_at,is_auto,users!recognitions_recipient_id_fkey(full_name,username)')
      .eq('is_revoked', false)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const myBadges = myBadgesRes.data ?? []
  const wall     = wallRes.data ?? []
  const canIssue = myProfile?.role === 'leader' || myProfile?.role === 'admin'

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Recognition</h1>
          <p style={{ fontSize:13, color:S.tx2 }}>Celebrating team achievements and milestones</p>
        </div>
        {canIssue && (
          <Link href="/recognition/issue" style={{
            padding:'9px 18px', borderRadius:8, background:S.navy, color:'#fff',
            fontSize:13, fontWeight:700, textDecoration:'none',
          }}>
            + Issue Badge
          </Link>
        )}
      </div>

      {/* My badges */}
      {myBadges.length > 0 && (
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, fontWeight:700, color:S.mu, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>
            Your Badges ({myBadges.length})
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {myBadges.map(b => {
              const st = BADGE[b.badge_type] ?? BADGE.custom
              return (
                <div key={b.id} style={{
                  background:S.s1, border:`1px solid ${st.bd}`, borderRadius:12, padding:'16px 14px',
                  textAlign:'center', width:120, boxShadow:'0 1px 3px rgba(0,0,0,0.05)',
                }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>{st.icon}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:st.color, background:st.bg, border:`1px solid ${st.bd}`, padding:'2px 8px', borderRadius:20, marginBottom:6, display:'inline-block' }}>
                    {st.label}
                  </div>
                  <div style={{ fontSize:11, color:S.tx2, lineHeight:1.4 }}>{b.title}</div>
                  {b.is_auto && <div style={{ fontSize:10, color:S.mu, marginTop:4 }}>Auto</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recognition wall */}
      <div style={{ fontSize:11, fontWeight:700, color:S.mu, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>
        Recognition Wall
      </div>

      {wall.length === 0 ? (
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:60, textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🏅</div>
          <div style={{ fontSize:15, fontWeight:700, color:S.tx, marginBottom:6 }}>No recognitions yet</div>
          <div style={{ fontSize:13, color:S.mu }}>
            {canIssue ? 'Issue a badge to celebrate a team member.' : 'Leaders can issue badges to celebrate team members.'}
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
          {wall.map((r, idx) => {
            const recipient = (r as any).users
            const st  = BADGE[r.badge_type] ?? BADGE.custom
            const pal = PALETTES[idx % PALETTES.length]
            return (
              <div key={r.id} style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Recipient */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:pal.bg, border:`1px solid ${pal.bd}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:pal.tx, flexShrink:0 }}>
                    {initials(recipient?.full_name ?? '?')}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:S.tx }}>{recipient?.full_name ?? '—'}</div>
                    <div style={{ fontSize:11, color:S.mu }}>@{recipient?.username ?? '—'}</div>
                  </div>
                  <div style={{ marginLeft:'auto', fontSize:24 }}>{st.icon}</div>
                </div>

                {/* Badge chip */}
                <div style={{ marginBottom:10 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:st.color, background:st.bg, border:`1px solid ${st.bd}`, padding:'3px 10px', borderRadius:20 }}>
                    {st.label}
                  </span>
                  {r.is_auto && <span style={{ marginLeft:6, fontSize:10, color:S.mu, background:S.s3, border:`1px solid ${S.bd}`, padding:'2px 8px', borderRadius:20 }}>Auto</span>}
                </div>

                {/* Content */}
                <div style={{ fontSize:13, fontWeight:700, color:S.tx, marginBottom:6 }}>{r.title}</div>
                {r.message && (
                  <div style={{ fontSize:12, color:S.tx2, lineHeight:1.7, marginBottom:12 }}>{r.message}</div>
                )}

                {/* Footer */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:12, borderTop:`1px solid ${S.bd}`, fontSize:11, color:S.mu }}>
                  <span>{r.is_auto ? 'Auto-awarded' : 'Issued by leader'}</span>
                  <span>{fmt(r.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
