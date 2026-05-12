'use client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const S = {
  navy: '#0F1C2E', gold: '#D4A017', goldBg: 'rgba(212,160,23,0.12)',
  bd: '#E2E8F0', tx2: '#475569', bg: '#F0F4F8',
}

const ADMIN_LINKS = [
  { href: '/admin/dashboard',           label: 'Dashboard',         icon: '⚡' },
  { href: '/admin/users',               label: 'Members',           icon: '👥' },
  { href: '/admin/invites',             label: 'Invite Links',      icon: '🔗' },
  { href: '/admin/announcements',       label: 'Announcements',     icon: '📢' },
  { href: '/admin/alerts',              label: 'Alerts',            icon: '🔴' },
  { href: '/admin/override',            label: 'Override',          icon: '🛡️' },
  { href: '/admin/goal-history',        label: 'Goal History',      icon: '📅' },
  { href: '/admin/templates',           label: 'Templates',         icon: '📝' },
  { href: '/admin/ranks',               label: 'Ranks',             icon: '🏅' },
  { href: '/admin/leaderboard-settings',label: 'Leaderboard',       icon: '🏆' },
  { href: '/admin/verification-audit',  label: 'Audit',             icon: '🔍' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const [ok, setOk] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      supabase.from('users').select('role').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.role !== 'admin') { window.location.href = '/dashboard'; return }
          setOk(true)
        })
    })
  }, [])

  if (ok === null) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh' }}>
      <div style={{ width:28, height:28, borderRadius:'50%', border:`3px solid ${S.bd}`, borderTop:`3px solid ${S.navy}`, animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!ok) return null

  return (
    <div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .adm-nav-scroll::-webkit-scrollbar{height:0}
        .adm-nav-scroll{scrollbar-width:none}
      `}</style>

      {/* Admin navigation bar */}
      <div style={{
        background: S.navy, borderRadius: 10, padding: '4px 6px',
        marginBottom: 20, display: 'flex', alignItems: 'center', gap: 2,
        overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }} className="adm-nav-scroll">
        {ADMIN_LINKS.map(link => {
          const active = pathname === link.href ||
            (link.href !== '/admin/dashboard' && pathname.startsWith(link.href))
          return (
            <Link key={link.href} href={link.href} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
              background: active ? S.goldBg : 'transparent',
              color: active ? S.gold : 'rgba(255,255,255,0.55)',
              border: active ? '1px solid rgba(212,160,23,0.3)' : '1px solid transparent',
              fontSize: 13, fontWeight: active ? 700 : 500,
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 14 }}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}
