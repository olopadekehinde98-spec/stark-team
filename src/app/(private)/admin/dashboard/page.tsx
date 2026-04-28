import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const S = {
  s1:'#FFFFFF',s2:'#F8FAFC',s3:'#EEF2F7',bd:'#E2E8F0',
  navy:'#0F1C2E',gold:'#D4A017',goldBg:'#FEF9EC',goldBd:'#F5D87A',
  tx:'#0F172A',tx2:'#475569',mu:'#94A3B8',
  ok:'#16A34A',okBg:'#F0FDF4',okBd:'#86EFAC',
  warn:'#D97706',warnBg:'#FFFBEB',warnBd:'#FCD34D',
  err:'#DC2626',errBg:'#FEF2F2',errBd:'#FCA5A5',
  blue:'#2563EB',blueBg:'#EFF6FF',blueBd:'#BFDBFE',
}

function initials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_PALETTES = [
  { bg:'#EFF6FF', tx:S.blue,    bd:'#BFDBFE' },
  { bg:'#F0FDF4', tx:S.ok,      bd:'#86EFAC' },
  { bg:'#FEF9EC', tx:S.gold,    bd:'#F5D87A' },
  { bg:'#FEF2F2', tx:S.err,     bd:'#FCA5A5' },
  { bg:'#F5F3FF', tx:'#7C3AED', bd:'#DDD6FE' },
]

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('users').select('role,rank,full_name').eq('id', user.id).single()
  if (myProfile?.role !== 'admin') redirect('/dashboard')

  const [totalUsersRes, activeWeekRes, pendingRes, usersListRes, invitesRes] = await Promise.all([
    supabase.from('users').select('*', { count:'exact', head:true }).eq('is_active', true),
    supabase.from('activities').select('user_id').gte('submitted_at', new Date(Date.now() - 7 * 864e5).toISOString()),
    supabase.from('activities').select('*', { count:'exact', head:true }).eq('status', 'pending'),
    supabase.from('users').select('id,full_name,username,role,rank,is_active,created_at').order('created_at', { ascending:false }).limit(10),
    supabase.from('invite_tokens').select('id,email,token,created_at,used_at').order('created_at', { ascending:false }).limit(5),
  ])

  const totalUsers   = totalUsersRes.count ?? 0
  const activeWeek   = new Set(activeWeekRes.data?.map((a: any) => a.user_id)).size
  const pendingCount = pendingRes.count ?? 0
  const usersList    = usersListRes.data ?? []
  const invites      = invitesRes.data ?? []

  return (
    <div>
      {/* Header */}
      {(() => {
        const rankMap: Record<string,string> = {
          distributor:'Distributor', manager:'Manager',
          senior_manager:'Senior Manager', executive_manager:'Executive', director:'Director',
        }
        const rankDisplay = rankMap[myProfile?.rank ?? ''] ?? (myProfile?.rank?.replace(/_/g,' ').replace(/\b\w/g,(c:string)=>c.toUpperCase()) ?? '')
        return (
          <div style={{ marginBottom:22 }}>
            <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Admin Panel</h1>
            <p style={{ fontSize:13, color:S.tx2 }}>
              {myProfile?.full_name ?? 'Admin'}
              {rankDisplay ? ` · ${rankDisplay}` : ''}
              {' · Full platform access'}
            </p>
          </div>
        )
      })()}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { icon:'👥', label:'Total users',      value:totalUsers,      bc:S.warn  },
          { icon:'✅', label:'Active this week',  value:activeWeek,      bc:S.ok    },
          { icon:'⏳', label:'Pending reviews',   value:pendingCount,    bc:S.blue  },
          { icon:'🔗', label:'Invite links',      value:invites.length,  bc:S.gold  },
        ].map((s, i) => (
          <div key={i} style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:S.s3, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{s.icon}</div>
            </div>
            <div style={{ fontSize:28, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', lineHeight:1, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:12, fontWeight:500, color:S.tx2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>

        {/* Users table */}
        <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, overflow:'hidden', boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', borderBottom:`1px solid ${S.bd}` }}>
            <span style={{ fontSize:14, fontWeight:700, color:S.tx }}>Users</span>
            <Link href="/admin/users" style={{ fontSize:12, color:S.blue, fontWeight:600, textDecoration:'none' }}>Manage all →</Link>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:S.s2 }}>
                {['Name','Rank','Status',''].map(h => (
                  <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:S.mu, borderBottom:`1px solid ${S.bd}`, letterSpacing:'0.04em', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usersList.length === 0 ? (
                <tr><td colSpan={4} style={{ padding:30, textAlign:'center', color:S.mu, fontSize:13 }}>No users</td></tr>
              ) : usersList.map((u, i) => {
                const pal = AVATAR_PALETTES[i % AVATAR_PALETTES.length]
                return (
                  <tr key={u.id} style={{ borderBottom:i<usersList.length-1?`1px solid ${S.bd}`:'none' }}>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, background:pal.bg, border:`1px solid ${pal.bd}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:pal.tx }}>
                          {initials(u.full_name)}
                        </div>
                        <span style={{ fontSize:13, fontWeight:600, color:S.tx }}>{u.full_name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ fontSize:11, color:S.gold, fontWeight:600 }}>
                        {u.rank?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{
                        fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20,
                        background: u.is_active ? S.okBg : S.errBg,
                        color:      u.is_active ? S.ok   : S.err,
                        border:    `1px solid ${u.is_active ? S.okBd : S.errBd}`,
                      }}>{u.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <Link href="/admin/users" style={{ fontSize:12, color:S.blue, fontWeight:600, textDecoration:'none' }}>Edit</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* System alerts */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:14, fontWeight:700, color:S.err }}>System Alerts</span>
              <Link href="/admin/alerts" style={{ fontSize:12, color:S.blue, fontWeight:600, textDecoration:'none' }}>See all</Link>
            </div>
            <div style={{ background:S.errBg, border:`1px solid ${S.errBd}`, borderRadius:8, padding:'11px 14px', display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
              <span>🔴</span>
              <div style={{ fontSize:13, color:S.err }}>Review verification patterns for abnormal approval rates</div>
            </div>
            <div style={{ background:S.warnBg, border:`1px solid ${S.warnBd}`, borderRadius:8, padding:'11px 14px', display:'flex', alignItems:'flex-start', gap:8 }}>
              <span>🟡</span>
              <div style={{ fontSize:13, color:S.warn }}>
                {pendingCount > 0 ? `${pendingCount} activities pending verification` : 'No pending alerts'}
              </div>
            </div>
          </div>

          {/* Invite links */}
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:14, fontWeight:700, color:S.tx }}>Invite Links</span>
              <Link href="/admin/invites" style={{ fontSize:12, color:S.blue, fontWeight:600, textDecoration:'none' }}>+ Create</Link>
            </div>
            {invites.length === 0 ? (
              <div style={{ fontSize:13, color:S.mu, textAlign:'center', padding:'16px 0' }}>No invite links yet</div>
            ) : invites.map((inv, i) => (
              <div key={inv.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:i<invites.length-1?`1px solid ${S.bd}`:'none' }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:inv.used_at?S.mu:S.gold, fontWeight:600, flex:1 }}>
                  {inv.token?.slice(0,12)}…
                </span>
                <span style={{ fontSize:11, fontWeight:500, color:S.tx2, background:S.s3, border:`1px solid ${S.bd}`, padding:'2px 8px', borderRadius:20 }}>
                  Member
                </span>
                <span style={{
                  fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20,
                  background: inv.used_at ? S.s3 : S.okBg,
                  color:      inv.used_at ? S.tx2 : S.ok,
                  border:    `1px solid ${inv.used_at ? S.bd : S.okBd}`,
                }}>{inv.used_at ? 'Used' : 'Active'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
