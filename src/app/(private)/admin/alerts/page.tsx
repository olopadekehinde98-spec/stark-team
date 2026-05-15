import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', bd:'#E2E8F0',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  warn:'#D97706', warnBg:'#FFFBEB', warnBd:'#FCD34D',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
  blue:'#2563EB', blueBg:'#EFF6FF', blueBd:'#BFDBFE',
}

export default async function AdminAlertsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (myProfile?.role !== 'admin') redirect('/dashboard')

  const [pendingRes, usersRes, activitiesRes] = await Promise.all([
    supabase.from('activities').select('*', { count:'exact', head:true }).eq('status','pending'),
    supabase.from('users').select('*', { count:'exact', head:true }),
    supabase.from('activities').select('*', { count:'exact', head:true }),
  ])

  const pendingCount = pendingRes.count ?? 0
  const totalUsers   = usersRes.count ?? 0
  const totalActs    = activitiesRes.count ?? 0

  const alerts = [
    pendingCount > 10 && {
      level: 'err', icon:'🔴',
      msg: `${pendingCount} activities have been waiting for verification — review urgently`,
    },
    pendingCount > 0 && pendingCount <= 10 && {
      level: 'warn', icon:'🟡',
      msg: `${pendingCount} activities pending verification`,
    },
    totalUsers === 0 && {
      level: 'warn', icon:'🟡',
      msg: 'No members have joined yet — create an invite link to get started',
    },
    {
      level: 'ok', icon:'🟢',
      msg: `Platform healthy · ${totalUsers} members · ${totalActs} total activities logged`,
    },
  ].filter(Boolean) as { level:string; icon:string; msg:string }[]

  function alertStyle(level: string) {
    if (level === 'err')  return { background:S.errBg,  border:`1px solid ${S.errBd}`,  color:S.err  }
    if (level === 'warn') return { background:S.warnBg, border:`1px solid ${S.warnBd}`, color:S.warn }
    return                       { background:S.okBg,   border:`1px solid ${S.okBd}`,   color:S.ok   }
  }

  return (
    <div>
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>System Alerts</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>Live platform health checks</p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {alerts.map((a, i) => (
          <div key={i} style={{ borderRadius:10, padding:'14px 18px', display:'flex', alignItems:'flex-start', gap:12, ...alertStyle(a.level) }}>
            <span style={{ fontSize:18 }}>{a.icon}</span>
            <span style={{ fontSize:14, fontWeight:500 }}>{a.msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
