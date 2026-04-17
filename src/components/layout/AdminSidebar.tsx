'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Users, Link2, ShieldCheck, Trophy, Bell, Star, Settings, LogOut, ArrowLeft } from 'lucide-react'

const adminNav = [
  { href:'/admin/dashboard',           label:'Dashboard',          icon:LayoutDashboard },
  { href:'/admin/users',               label:'Users',              icon:Users },
  { href:'/admin/invites',             label:'Invites',            icon:Link2 },
  { href:'/admin/verification-audit',  label:'Verification Audit', icon:ShieldCheck },
  { href:'/admin/leaderboard-settings',label:'Leaderboard',        icon:Trophy },
  { href:'/admin/announcements',       label:'Announcements',      icon:Bell },
  { href:'/admin/alerts',              label:'Alerts',             icon:Bell },
  { href:'/admin/ranks',               label:'Rank Criteria',      icon:Star },
  { href:'/admin/templates',           label:'Templates',          icon:Settings },
]

export default function AdminSidebar({ userName }: { userName?:string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen border-r px-3 py-5"
      style={{ background:'var(--bg-surface)', borderColor:'var(--border)' }}>
      <div className="px-3 mb-2">
        <h1 className="text-xl font-bold tracking-widest" style={{ color:'var(--gold)' }}>STARK TEAM</h1>
        <p className="text-xs mt-0.5" style={{ color:'var(--error)' }}>Admin Panel</p>
      </div>
      <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 mb-4 text-xs rounded-lg"
        style={{ color:'var(--text-muted)' }}>
        <ArrowLeft size={12}/> Back to app
      </Link>
      <nav className="flex-1 space-y-0.5">
        {adminNav.map(item=>{
          const Icon = item.icon
          const active = pathname===item.href
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background:active?'var(--gold-muted)':'transparent', color:active?'var(--gold)':'var(--text-secondary)' }}>
              <Icon size={15}/>{item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t pt-4 mt-4" style={{ borderColor:'var(--border)' }}>
        <p className="px-3 text-xs font-medium mb-2" style={{ color:'var(--text-muted)' }}>{userName}</p>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full" style={{ color:'var(--text-muted)' }}>
          <LogOut size={15}/>Sign out
        </button>
      </div>
    </aside>
  )
}