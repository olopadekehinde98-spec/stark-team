import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
const avatarGradients = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ec4899,#db2777)',
  'linear-gradient(135deg,#14b8a6,#0d9488)',
  'linear-gradient(135deg,#3b82f6,#2563eb)',
  'linear-gradient(135deg,#ef4444,#dc2626)',
]

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (myProfile?.role !== 'admin') redirect('/dashboard')

  const [totalUsersRes, activeWeekRes, pendingRes, usersListRes, invitesRes] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('activities').select('user_id').gte('submitted_at', new Date(Date.now() - 7 * 864e5).toISOString()),
    supabase.from('activities').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('users').select('id,full_name,username,role,rank,is_active,created_at').order('created_at', { ascending: false }).limit(15),
    supabase.from('invite_tokens').select('id,email,token,created_at,used_at,expires_at').order('created_at', { ascending: false }).limit(8),
  ])

  const totalUsers   = totalUsersRes.count ?? 0
  const activeWeek   = new Set(activeWeekRes.data?.map((a: any) => a.user_id)).size
  const pendingCount = pendingRes.count ?? 0
  const usersList    = usersListRes.data ?? []
  const invites      = invitesRes.data ?? []

  const stats = [
    { label: 'Total Operatives', value: totalUsers,     color: '#6366f1', icon: '◈' },
    { label: 'Active This Week', value: activeWeek,     color: '#10b981', icon: '⚡' },
    { label: 'Pending Reviews',  value: pendingCount,   color: '#f59e0b', icon: '◔' },
    { label: 'Invite Tokens',    value: invites.length, color: '#8b5cf6', icon: '✉' },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>Admin Panel</h1>
        <div style={{ fontSize: 11, color: '#4b5563', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Command Control · Platform Overview
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: '#111827', border: '1px solid #1f2937', borderLeft: `3px solid ${s.color}`,
            borderRadius: 14, padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              <span style={{ fontSize: 18, color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

        {/* Roster table */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #1f2937' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Operative Roster</div>
            <Link href="/admin/users" style={{ fontSize: 12, color: '#6366f1', fontWeight: 500, textDecoration: 'none' }}>Manage all →</Link>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1f2937', borderBottom: '1px solid #374151' }}>
                {['Operative', 'Role', 'Rank', 'Joined', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#4b5563' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usersList.length === 0
                ? <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: '#4b5563', fontSize: 13 }}>No users found</td></tr>
                : usersList.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i < usersList.length - 1 ? '1px solid #1f2937' : 'none' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: 10, flexShrink: 0, background: avatarGradients[i % avatarGradients.length] }}>
                          {initials(u.full_name)}
                        </div>
                        <div>
                          <Link href={`/profile/${u.username}`} style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', textDecoration: 'none' }}>{u.full_name}</Link>
                          <div style={{ fontSize: 11, color: '#4b5563' }}>@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'capitalize', color: u.role === 'admin' ? '#f59e0b' : u.role === 'leader' ? '#818cf8' : '#6b7280' }}>{u.role}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.18)' }}>
                        {u.rank?.replace(/_/g, ' ') ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>{fmt(u.created_at)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: u.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: u.is_active ? '#34d399' : '#f87171' }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Admin tools */}
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>Admin Tools</div>
            {[
              { label: 'Manage Users',    href: '/admin/users',              icon: '◈', color: '#6366f1' },
              { label: 'Invite Tokens',   href: '/admin/invites',            icon: '✉', color: '#8b5cf6' },
              { label: 'Verify Audit',    href: '/admin/verification-audit', icon: '✓', color: '#10b981' },
              { label: 'Announcements',   href: '/admin/announcements',      icon: '📢', color: '#f59e0b' },
              { label: 'System Alerts',   href: '/admin/alerts',             icon: '⚠', color: '#ef4444' },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                borderRadius: 8, marginBottom: 4, background: '#1f2937', textDecoration: 'none',
              }}>
                <span style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: item.color }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{item.label}</span>
                <span style={{ marginLeft: 'auto', color: '#4b5563' }}>→</span>
              </Link>
            ))}
          </div>

          {/* Invite tokens */}
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, overflow: 'hidden', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #1f2937' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>Invite Tokens</div>
              <Link href="/admin/invites" style={{ fontSize: 12, color: '#6366f1', fontWeight: 500, textDecoration: 'none' }}>+ New</Link>
            </div>
            <div style={{ padding: '12px 16px' }}>
              {invites.length === 0
                ? <div style={{ fontSize: 13, color: '#4b5563', textAlign: 'center', padding: '20px 0' }}>No tokens yet</div>
                : invites.map(inv => (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: '#1f2937', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{inv.email ?? 'Open Invite'}</div>
                      <div style={{ fontSize: 10, color: '#4b5563', marginTop: 1 }}>{inv.token?.slice(0, 12)}…</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: inv.used_at ? 'rgba(75,85,99,0.2)' : 'rgba(16,185,129,0.12)', color: inv.used_at ? '#6b7280' : '#34d399' }}>
                      {inv.used_at ? 'Used' : 'Active'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
