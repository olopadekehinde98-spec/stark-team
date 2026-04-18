'use client'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

function LiveClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="clock">{time}</span>
}

function Sidebar({ userName, userRank, pendingCount }: { userName?: string; userRank?: string; pendingCount: number }) {
  const pathname = usePathname()
  const router = useRouter()

  const navSections = [
    {
      label: 'Main',
      items: [
        { label: 'Dashboard',   href: '/dashboard',   icon: '⊞' },
        { label: 'Activities',  href: '/activities',  icon: '⚡' },
        { label: 'Goals',       href: '/goals',       icon: '◎' },
        { label: 'Leaderboard', href: '/leaderboard', icon: '▲' },
      ],
    },
    {
      label: 'Team',
      items: [
        { label: 'Verify Queue', href: '/verify', icon: '✓', badge: pendingCount },
        { label: 'Team Tree',    href: '/team',   icon: '◈' },
      ],
    },
    {
      label: 'Tools',
      items: [
        { label: 'AI Coach',    href: '/ai-coach',        icon: '◆' },
        { label: 'Admin Panel', href: '/admin/dashboard', icon: '⚙' },
        { label: 'Profile',     href: '/profile',         icon: '▣' },
      ],
    },
  ]

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userName
    ? userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <div style={{
      width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: '#111827', borderRight: '1px solid #1f2937',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.4))',
          }}>
            <Image src="/stark-logo.png" alt="Stark Team" width={130} height={87} priority style={{ display: 'block' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="dot-active" />
          <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600, letterSpacing: '0.06em' }}>
            SYSTEMS ONLINE
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
        {navSections.map(section => (
          <div key={section.label} style={{ marginBottom: 8 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: '#4b5563',
              letterSpacing: '0.10em', textTransform: 'uppercase',
              padding: '6px 8px 6px',
            }}>
              {section.label}
            </div>
            {section.items.map(item => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href}
                  className={`nav-item${isActive ? ' active' : ''}`}
                  style={{ position: 'relative' }}
                >
                  <span style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {'badge' in item && (item.badge ?? 0) > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      background: '#6366f1',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 10,
                      padding: '1px 6px',
                    }}>{item.badge}</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User Card */}
      <div style={{ borderTop: '1px solid #1f2937', padding: '12px 12px 14px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 10px', borderRadius: 10,
          background: '#1f2937', cursor: 'pointer',
        }}>
          <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#e2e8f0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{userName ?? 'Operative'}</div>
            <div style={{
              fontSize: 11, color: '#6b7280',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{userRank?.replace(/_/g, ' ') ?? 'Member'}</div>
          </div>
          <button onClick={handleSignOut} title="Sign out" style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 14, color: '#4b5563', padding: 4, transition: 'color 0.15s', flexShrink: 0,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}
          >✕</button>
        </div>
      </div>
    </div>
  )
}

function TopBar() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const rawTitle = segments[segments.length - 1] ?? 'dashboard'
  const pageTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1).replace(/-/g, ' ')

  return (
    <div style={{
      height: 58, flexShrink: 0,
      background: '#111827', borderBottom: '1px solid #1f2937',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 12,
    }}>
      <div className="topbar-title">{pageTitle}</div>
      <div style={{ flex: 1 }} />
      <LiveClock />
      {[
        { icon: '🔔', href: '/notifications', title: 'Notifications' },
        { icon: '⚙', href: '/settings', title: 'Settings' },
      ].map(btn => (
        <Link key={btn.href} href={btn.href} title={btn.title} style={{
          width: 36, height: 36, borderRadius: 8,
          background: '#1f2937', border: '1px solid #374151',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, textDecoration: 'none', color: '#9ca3af',
          transition: 'background 0.15s, color 0.15s',
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = '#374151'
            ;(e.currentTarget as HTMLElement).style.color = '#e2e8f0'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = '#1f2937'
            ;(e.currentTarget as HTMLElement).style.color = '#9ca3af'
          }}
        >{btn.icon}</Link>
      ))}
    </div>
  )
}

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [pendingCount, setPending] = useState(0)

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [profileRes, pendingRes] = await Promise.all([
        supabase.from('users').select('full_name,rank,role,branch_id').eq('id', user.id).single(),
        supabase.from('activities').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])
      setProfile(profileRes.data)
      setPending(pendingRes.count ?? 0)
    }
    loadProfile()
  }, [])

  if (!mounted) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0f1a' }}>
      <Sidebar userName={profile?.full_name} userRank={profile?.rank} pendingCount={pendingCount} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <TopBar />
        <main style={{ flex: 1, overflowY: 'auto', background: '#0b0f1a' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
