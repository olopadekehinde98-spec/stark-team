'use client'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/* ── LIVE CLOCK ──────────────────────────────────── */
function LiveClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="clock">{time}</span>
  )
}

/* ── SIDEBAR ─────────────────────────────────────── */
function Sidebar({
  userName, userRank, pendingCount,
}: {
  userName?: string; userRank?: string; pendingCount: number
}) {
  const pathname = usePathname()
  const router = useRouter()

  const navSections = [
    {
      label: 'OPERATIONS',
      items: [
        { label: 'DASHBOARD',   href: '/dashboard',   icon: '◆' },
        { label: 'ACTIVITIES',  href: '/activities',  icon: '⚡' },
        { label: 'GOALS',       href: '/goals',       icon: '▲' },
      ],
    },
    {
      label: 'COMMAND',
      items: [
        { label: 'VERIFY QUEUE', href: '/verify',      icon: '✓', badge: pendingCount },
        { label: 'LEADERBOARD',  href: '/leaderboard', icon: '★' },
        { label: 'TEAM TREE',    href: '/team',        icon: '◎' },
      ],
    },
    {
      label: 'INTELLIGENCE',
      items: [
        { label: 'AI COACH',     href: '/ai-coach',         icon: '◉' },
        { label: 'ADMIN PANEL',  href: '/admin/dashboard',  icon: '⚙' },
        { label: 'PROFILE',      href: '/profile',          icon: '▣' },
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
    <div className="sidebar-gold-line" style={{
      width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: 'var(--s1)', borderRight: '1px solid var(--b2)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* ── LOGO ─────────────────────────────────── */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--b1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div className="hexagon" style={{
            width: 36, height: 36, background: 'var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 13, color: '#03060A',
            }}>ST</span>
          </div>
          <div>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 15, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--text-primary)', lineHeight: 1,
            }}>STARK TEAM</div>
            <div className="font-mono" style={{
              fontSize: 8, letterSpacing: '0.18em', color: 'var(--text-muted)',
              marginTop: 2,
            }}>Command Platform</div>
          </div>
        </div>

        {/* Systems status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="dot-active" />
          <span className="font-mono" style={{
            fontSize: 8, letterSpacing: '0.2em', color: 'var(--success)',
          }}>SYSTEMS OPERATIONAL</span>
        </div>
      </div>

      {/* ── NAV ──────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {navSections.map((section) => (
          <div key={section.label} style={{ marginBottom: 6 }}>
            <div className="font-mono" style={{
              fontSize: 8, letterSpacing: '0.28em', color: 'var(--text-muted)',
              padding: '8px 16px 4px', textTransform: 'uppercase',
            }}>
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item${isActive ? ' active' : ''}`}
                  style={{ position: 'relative' }}
                >
                  <span style={{
                    fontFamily: 'Share Tech Mono, monospace', fontSize: 10,
                    color: isActive ? 'var(--gold)' : 'var(--text-muted)',
                    width: 14, flexShrink: 0,
                  }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {'badge' in item && (item.badge ?? 0) > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      background: 'var(--danger)',
                      color: '#fff',
                      fontFamily: 'Share Tech Mono, monospace',
                      fontSize: 8, padding: '1px 5px',
                      minWidth: 16, textAlign: 'center',
                    }}>{(item as any).badge}</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── USER CARD ────────────────────────────── */}
      <div style={{
        borderTop: '1px solid var(--b1)', padding: '12px 12px 10px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div className="hexagon" style={{
          width: 30, height: 30, background: 'var(--gold-dim)',
          border: '1px solid var(--gold-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            fontSize: 10, color: 'var(--gold)',
          }}>{initials}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
            fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{userName ?? 'OPERATIVE'}</div>
          <div className="font-mono" style={{
            fontSize: 8, color: 'var(--gold)', letterSpacing: '0.12em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{userRank?.replace(/_/g, ' ').toUpperCase() ?? 'MEMBER'}</div>
        </div>
        <button
          onClick={handleSignOut}
          title="Sign out"
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'Share Tech Mono, monospace', fontSize: 12,
            color: 'var(--text-muted)', padding: '4px',
            transition: 'color 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >✕</button>
      </div>
    </div>
  )
}

/* ── TOPBAR ──────────────────────────────────────── */
function TopBar() {
  const pathname = usePathname()

  const segments = pathname.split('/').filter(Boolean)
  const rawTitle = segments[segments.length - 1] ?? 'dashboard'
  const pageTitle = rawTitle.replace(/-/g, ' ').toUpperCase()
  const breadcrumb = ['STARK TEAM', ...segments.map(s => s.replace(/-/g, ' ').toUpperCase())]

  return (
    <div style={{
      height: 52, flexShrink: 0,
      background: 'var(--s1)', borderBottom: '1px solid var(--b2)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px',
    }}>
      {/* Left: title + breadcrumb */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>[</span>
          <span className="topbar-title">{pageTitle}</span>
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>]</span>
        </div>
        <div className="font-mono" style={{
          fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.15em', marginTop: 1,
        }}>{breadcrumb.join(' / ')}</div>
      </div>

      {/* Right: clock + buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <LiveClock />
        {[
          { icon: '🔔', title: 'Notifications', href: '/notifications' },
          { icon: '⚙', title: 'Settings', href: '/settings' },
        ].map(btn => (
          <Link key={btn.href} href={btn.href} title={btn.title} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32,
            background: 'transparent', border: '1px solid var(--b2)',
            color: 'var(--text-muted)', fontSize: 13,
            textDecoration: 'none', transition: 'border-color 0.15s, color 0.15s',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--b3)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--b2)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
            }}
          >{btn.icon}</Link>
        ))}
      </div>
    </div>
  )
}

/* ── PRIVATE LAYOUT ──────────────────────────────── */
export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted]       = useState(false)
  const [profile, setProfile]       = useState<any>(null)
  const [pendingCount, setPending]  = useState(0)

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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar
        userName={profile?.full_name}
        userRank={profile?.rank}
        pendingCount={pendingCount}
      />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <TopBar />
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
