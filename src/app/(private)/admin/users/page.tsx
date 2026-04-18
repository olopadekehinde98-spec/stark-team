import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import Avatar from '@/components/ui/Avatar'
import RankBadge from '@/components/ui/RankBadge'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/formatDate'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('users')
    .select('id,full_name,email,username,role,rank,is_active,created_at,branches(name)')
    .order('created_at',{ascending:false})

  return (
    <div className="p-6">
      <PageHeader title="Users" subtitle="All registered members" />
      <div className="rounded-xl border overflow-x-auto" style={{ borderColor:'var(--border)' }}>
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr style={{ background:'var(--bg-surface-2)', borderBottom:'1px solid var(--border)' }}>
              {['Member','Email','Role','Rank','Branch','Status','Joined'].map(h=>(
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color:'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(users??[]).map((u,i)=>(
              <tr key={u.id} style={{ background:i%2===0?'var(--bg-surface)':'var(--bg-surface-2)', borderBottom:'1px solid var(--border)' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.full_name} size="sm" />
                    <div>
                      <p className="font-medium" style={{ color:'var(--text-primary)' }}>{u.full_name}</p>
                      <p className="text-xs" style={{ color:'var(--text-muted)' }}>@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color:'var(--text-muted)' }}>{u.email}</td>
                <td className="px-4 py-3 capitalize" style={{ color:'var(--text-muted)' }}>{u.role}</td>
                <td className="px-4 py-3"><RankBadge rank={u.rank} /></td>
                <td className="px-4 py-3" style={{ color:'var(--text-muted)' }}>{(u.branches as any)?.name??'—'}</td>
                <td className="px-4 py-3"><Badge variant={u.is_active?'success':'error'}>{u.is_active?'Active':'Inactive'}</Badge></td>
                <td className="px-4 py-3" style={{ color:'var(--text-muted)' }}>{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}