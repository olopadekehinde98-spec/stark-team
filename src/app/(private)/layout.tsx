'use client'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

function LiveClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(
      new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 12, color: '#6366f1', letterSpacing: '0.06em',
      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.20)',
      padding: '4px 10px', borderRadius: 6,
    }}>{time || '--:--:--'}</span>
  )
}

const NAV = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard',   href: '/dashboard',   icon: '▦' },
      { label: 'Activities',  href: '/activities',  icon: '⚡' },
      { label: 'Goals',       href: '/goals',       icon: '◎' },
      { label: 'Leaderboard', href: '/leaderboard', icon: '▲' },
    ],
  },
  {
    label: 'Team',
    items: [
      { label: 'Verify Queue', href: '/verify',  icon: '✓', badge: true },
      { label: 'Team Tree',    href: '/team',    icon: '◈' },
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

function Sidebar({ userName, userRole, userRank, pendingCount }: {
  userName?: string; userRole?: string; userRank?: string; pendingCount: number
}) {
  const pathname = usePathname()
  const router   = useRouter()

  const initials = userName
    ? userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside style={{
      width: 248, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: '#0d1117',
      borderRight: '1px solid rgba(99,102,241,0.12)',
      position: 'relative',
    }}>
      {/* Subtle left glow stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 2,
        background: 'linear-gradient(180deg, transparent 0%, #6366f1 30%, #8b5cf6 70%, transparent 100%)',
        opacity: 0.5,
      }} />

      {/* Logo area */}
      <div style={{
        padding: '22px 20px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{
          filter: 'drop-shadow(0 0 16px rgba(99,102,241,0.5))',
          marginBottom: 14,
        }}>
          <Image src="/stark-logo.png" alt="Stark Team" width={140} height={94} priority style={{ display: 'block' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 8px #10b981',
            animation: 'pulse-green 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700, letterSpacing: '0.10em' }}>
            SYSTEMS ONLINE
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
        {NAV.map(section => (
          <div key={section.label} style={{ marginBottom: 6 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: '#374151',
              letterSpacing: '0.14em', textTransform: 'uppercase',
              padding: '5px 8px 7px',
            }}>
              {section.label}
            </div>
            {section.items.map(item => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 9,
                  marginBottom: 2, textDecoration: 'none',
                  transition: 'all 0.12s',
                  position: 'relative',
                  ...(isActive ? {
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))',
                    boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.25)',
                  } : {
                    background: 'transparent',
                  }),
                }}>
                  <span style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, transition: 'all 0.12s',
                    ...(isActive ? {
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff',
                      boxShadow: '0 2px 10px rgba(99,102,241,0.4)',
                    } : {
                      background: '#1f2937',
                      color: '#6b7280',
                    }),
                  }}>{item.icon}</span>
                  <span style={{
                    fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#c4b5fd' : '#9ca3af',
                    flex: 1,
                  }}>{item.label}</span>
                  {'badge' in item && item.badge && pendingCount > 0 && (
                    <span style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff', fontSize: 10, fontWeight: 700,
                      borderRadius: 10, padding: '1px 7px',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
                    }}>{pendingCount}</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User card */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.10), rgba(139,92,246,0.06))',
          border: '1px solid rgba(99,102,241,0.18)',
          borderRadius: 10, padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#fff',
            boxShadow: '0 0 12px rgba(99,102,241,0.4)',
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#e2e8f0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{userName ?? 'Operative'}</div>
            <div style={{
              fontSize: 10, color: '#6366f1', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{userRank?.replace(/_/g, ' ') ?? 'Member'}</div>
          </div>
          <button onClick={handleSignOut} title="Sign out" style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 16, color: '#374151', padding: 4,
            transition: 'color 0.15s', flexShrink: 0,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#374151')}
          >⏻</button>
        </div>
      </div>
    </aside>
  )
}

function TopBar({ pageTitle }: { pageTitle: string }) {
  return (
    <header style={{
      height: 60, flexShrink: 0,
      background: '#0d1117',
      borderBottom: '1px solid rgba(99,102,241,0.10)',
      display: 'flex', alignItems: 'center',
      padding: '0 28px', gap: 16,
    }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>STARK TEAM</span>
        <span style={{ color: '#1f2937', fontSize: 14 }}>›</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>{pageTitle}</span>
      </div>
      <div style={{ flex: 1 }} />
      <LiveClock />
      {[
        { icon: '🔔', href: '/notifications', title: 'Notifications' },
        { icon: '⚙', href: '/settings', title: 'Settings' },
      ].map(btn => (
        <Link key={btn.href} href={btn.href} title={btn.title} style={{
          width: 36, height: 36, borderRadius: 8,
          background: '#111827', border: '1px solid #1f2937',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, textDecoration: 'none', color: '#4b5563',
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)'
            ;(e.currentTarget as HTMLElement).style.color = '#818cf8'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = '#1f2937'
            ;(e.currentTarget as HTMLElement).style.color = '#4b5563'
          }}
        >{btn.icon}</Link>
      ))}
    </header>
  )
}

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted]     = useState(false)
  const [profile, setProfile]     = useState<any>(null)
  const [pendingCount, setPending] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [profileRes, pendingRes] = await Promise.all([
        supabase.from('users').select('full_name,rank,role').eq('id', user.id).single(),
        supabase.from('activities').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])
      setProfile(profileRes.data)
      setPending(pendingRes.count ?? 0)
    })()
  }, [])

  const segments  = pathname.split('/').filter(Boolean)
  const rawTitle  = segments[segments.length - 1] ?? 'dashboard'
  const pageTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1).replace(/-/g, ' ')

  if (!mounted) return (
    <div style={{
      minHeight: '100vh', background: '#0b0f1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid rgba(99,102,241,0.2)',
          borderTop: '3px solid #6366f1',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: 12, color: '#4b5563', letterSpacing: '0.1em' }}>LOADING...</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 4px #10b981; }
          50%       { box-shadow: 0 0 12px #10b981, 0 0 24px rgba(16,185,129,0.3); }
        }
      `}</style>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0f1a' }}>
        <Sidebar
          userName={profile?.full_name}
          userRole={profile?.role}
          userRank={profile?.rank}
          pendingCount={pendingCount}
        />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <TopBar pageTitle={pageTitle} />
          <main style={{ flex: 1, overflowY: 'auto', background: '#0b0f1a' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
