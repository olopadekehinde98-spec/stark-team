'use client'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { label: 'Dashboard',    href: '/dashboard'        },
  { label: 'Activities',   href: '/activities'       },
  { label: 'Goals',        href: '/goals'            },
  { label: 'AOL',          href: '/aol'              },
  { label: 'Leaderboard',  href: '/leaderboard'      },
  { label: 'Team',         href: '/team'             },
  { label: 'Chat',         href: '/chat'             },
  { label: 'Inbox',        href: '/inbox'            },
  { label: 'Recognition',  href: '/recognition'      },
  { label: 'Notifications',href: '/notifications'    },
  { label: '❓ Help',      href: '/help'             },
]

// Neolife rank display names
function fmtRank(rank?: string) {
  const map: Record<string, string> = {
    distributor:       'Distributor',
    manager:           'Manager',
    senior_manager:    'Senior Manager',
    executive_manager: 'Executive',
    director:          'Director',
  }
  if (!rank) return 'Member'
  return map[rank] ?? rank.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const S = {
  navy: '#0F1C2E',
  gold: '#D4A017',
  bg:   '#F0F4F8',
  bd:   '#E2E8F0',
  tx:   '#0F172A',
  tx2:  '#475569',
}

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const [profile,  setProfile]  = useState<any>(null)
  const [pending,  setPending]  = useState(0)
  const [notifCount, setNotif]  = useState(0)
  const pathname = usePathname()
  const router   = useRouter()

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [profRes, pendRes, notifRes] = await Promise.all([
        supabase.from('users').select('full_name,rank,role').eq('id', user.id).single(),
        supabase.from('activities').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
      ])
      setProfile(profRes.data)
      setPending(pendRes.count ?? 0)
      setNotif(notifRes.count ?? 0)
    })()
  }, [router])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  const rankLabel = fmtRank(profile?.rank)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: S.bg }}>
      {/* TOP NAV */}
      <nav style={{
        height: 58, background: S.navy, display: 'flex', alignItems: 'center',
        padding: '0 24px', flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, textDecoration: 'none', marginRight: 28 }}>
          <div style={{
            width: 32, height: 32, background: S.gold, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: S.navy,
          }}>ST</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-.01em', marginLeft: 10 }}>
            Stark Team
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {NAV_LINKS.map(link => {
            const isActive = pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href))
            return (
              <Link key={link.href} href={link.href} style={{
                padding: '7px 14px', fontSize: 13, fontWeight: 500, borderRadius: 6,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>{link.label}</Link>
            )
          })}
          {/* Verify Queue — leaders + admins */}
          {(profile?.role === 'leader' || profile?.role === 'admin') && (() => {
            const isActive = pathname === '/verify'
            return (
              <Link href="/verify" style={{
                padding: '7px 14px', fontSize: 13, fontWeight: isActive ? 600 : 500, borderRadius: 6,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>✓ Verify</Link>
            )
          })()}
          {/* Admin-only link */}
          {profile?.role === 'admin' && (() => {
            const isActive = pathname.startsWith('/admin')
            return (
              <Link href="/admin/dashboard" style={{
                padding: '7px 14px', fontSize: 13, fontWeight: 600, borderRadius: 6,
                color: isActive ? S.gold : S.gold,
                background: isActive ? 'rgba(212,160,23,0.18)' : 'rgba(212,160,23,0.10)',
                border: `1px solid rgba(212,160,23,0.25)`,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>⚡ Admin</Link>
            )
          })()}
        </div>

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Notifications */}
          <Link href="/notifications" style={{
            position: 'relative', width: 34, height: 34, borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.6)', fontSize: 15, textDecoration: 'none',
          }}>
            🔔
            {notifCount > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                width: 8, height: 8, borderRadius: '50%', background: '#DC2626',
              }} />
            )}
          </Link>

          {/* Settings */}
          <Link href="/settings" style={{
            width: 34, height: 34, borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.6)', fontSize: 15, textDecoration: 'none',
          }}>⚙</Link>

          {/* Profile chip */}
          <Link href="/profile" style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '5px 12px 5px 6px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6, textDecoration: 'none',
          }}>
            <div style={{
              width: 28, height: 28, background: S.gold, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: S.navy,
            }}>{initials}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>
                {profile?.full_name?.split(' ')[0] ?? '…'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{rankLabel}</div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginLeft: 2 }}>▾</span>
          </Link>

          {/* Sign out */}
          <button onClick={handleSignOut} title="Sign out" style={{
            width: 34, height: 34, borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.5)', fontSize: 15, cursor: 'pointer',
          }}>⏻</button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '28px 24px', maxWidth: 1140, width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
