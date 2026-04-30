'use client'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// ── brand ──────────────────────────────────────────────────────────────────
const S = {
  navy: '#0F1C2E', navyL: 'rgba(255,255,255,0.08)',
  gold: '#D4A017', goldBg: 'rgba(212,160,23,0.12)',
  bg:   '#F0F4F8', bd:     '#E2E8F0',
  tx:   '#0F172A', tx2:    '#475569', mu: '#94A3B8',
}

// ── nav items ──────────────────────────────────────────────────────────────
const BOTTOM_TABS = [
  { label: 'Home',       href: '/dashboard',   icon: '🏠' },
  { label: 'Activities', href: '/activities',  icon: '📋' },
  { label: 'Goals',      href: '/goals',       icon: '🎯' },
  { label: 'Leaderboard',href: '/leaderboard', icon: '🏆' },
  { label: 'More',       href: '__more__',     icon: '⋯'  },
]

const MORE_LINKS = [
  { label: 'Team',          href: '/team',          icon: '👥' },
  { label: 'Chat',          href: '/chat',           icon: '💬' },
  { label: 'Inbox',         href: '/inbox',          icon: '📥' },
  { label: 'Recognition',   href: '/recognition',    icon: '🏅' },
  { label: 'Notifications', href: '/notifications',  icon: '🔔' },
  { label: 'AOL',           href: '/aol',            icon: '📊' },
  { label: 'Profile',       href: '/profile',        icon: '👤' },
  { label: 'Settings',      href: '/settings',       icon: '⚙️'  },
  { label: 'Help',          href: '/help',           icon: '❓' },
]

const DESKTOP_LINKS = [
  { label: 'Dashboard',    href: '/dashboard'    },
  { label: 'Activities',   href: '/activities'   },
  { label: 'Goals',        href: '/goals'        },
  { label: 'AOL',          href: '/aol'          },
  { label: 'Leaderboard',  href: '/leaderboard'  },
  { label: 'Team',         href: '/team'         },
  { label: 'Chat',         href: '/chat'         },
  { label: 'Inbox',        href: '/inbox'        },
  { label: 'Recognition',  href: '/recognition'  },
  { label: 'Notifications',href: '/notifications'},
  { label: '❓ Help',      href: '/help'         },
]

function fmtRank(rank?: string) {
  const map: Record<string, string> = {
    e_member:          'E-Member',
    distributor:       'Distributor',
    manager:           'Manager',
    senior_manager:    'Senior Manager',
    executive_manager: 'Executive',
    director:          'Director',
  }
  return rank ? (map[rank] ?? rank.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())) : 'Member'
}

// ── component ──────────────────────────────────────────────────────────────
export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const [profile,    setProfile]    = useState<any>(null)
  const [notifCount, setNotif]      = useState(0)
  const [showMore,   setShowMore]   = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [profRes, notifRes] = await Promise.all([
        supabase.from('users').select('full_name,rank,role').eq('id', user.id).single(),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
      ])
      setProfile(profRes.data)
      setNotif(notifRes.count ?? 0)
    })()
  }, [router])

  // close More drawer on nav
  useEffect(() => { setShowMore(false) }, [pathname])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  const isMoreActive = MORE_LINKS.some(l => pathname.startsWith(l.href))

  return (
    <>
      {/* ── responsive styles ─────────────────────────────────────── */}
      <style>{`
        .st-mobile-bar  { display: none; }
        .st-desktop-nav { display: flex;  }
        .st-page        { padding: 28px 24px; padding-bottom: 28px; }
        @media (max-width: 768px) {
          .st-mobile-bar  { display: flex;  }
          .st-desktop-nav { display: none;  }
          .st-page        { padding: 16px 14px; padding-bottom: 88px; }
          .st-topbar-logo-text { display: none; }
        }
      `}</style>

      <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background: S.bg }}>

        {/* ════════════════════════════════════════════════════════════
            TOP BAR  (always visible)
        ════════════════════════════════════════════════════════════ */}
        <nav style={{
          height: 58, background: S.navy,
          display: 'flex', alignItems: 'center',
          padding: '0 16px', flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          {/* Logo */}
          <Link href="/dashboard" style={{
            display: 'flex', alignItems: 'center',
            textDecoration: 'none', marginRight: 20, flexShrink: 0,
          }}>
            <div style={{
              width: 34, height: 34, background: S.gold, borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: S.navy,
            }}>ST</div>
            <span className="st-topbar-logo-text" style={{
              fontSize: 15, fontWeight: 700, color: '#fff',
              letterSpacing: '-.01em', marginLeft: 10,
            }}>Stark Team</span>
          </Link>

          {/* ── Desktop nav links ──────────────────────────────────── */}
          <div className="st-desktop-nav" style={{ alignItems:'center', gap: 2, flex: 1 }}>
            {DESKTOP_LINKS.map(link => {
              const active = pathname === link.href ||
                (link.href !== '/dashboard' && pathname.startsWith(link.href))
              return (
                <Link key={link.href} href={link.href} style={{
                  padding: '7px 12px', fontSize: 13, fontWeight: active ? 600 : 500,
                  borderRadius: 6, whiteSpace: 'nowrap', textDecoration: 'none',
                  color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                  background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                }}>{link.label}</Link>
              )
            })}
            {(profile?.role === 'leader' || profile?.role === 'admin') && (
              <Link href="/verify" style={{
                padding: '7px 12px', fontSize: 13, fontWeight: pathname === '/verify' ? 600 : 500,
                borderRadius: 6, whiteSpace: 'nowrap', textDecoration: 'none',
                color: pathname === '/verify' ? '#fff' : 'rgba(255,255,255,0.55)',
                background: pathname === '/verify' ? 'rgba(255,255,255,0.12)' : 'transparent',
              }}>✓ Verify</Link>
            )}
            {profile?.role === 'admin' && (
              <Link href="/admin/dashboard" style={{
                padding: '7px 12px', fontSize: 13, fontWeight: 600,
                borderRadius: 6, whiteSpace: 'nowrap', textDecoration: 'none',
                color: S.gold,
                background: pathname.startsWith('/admin') ? 'rgba(212,160,23,0.20)' : 'rgba(212,160,23,0.10)',
                border: '1px solid rgba(212,160,23,0.25)',
              }}>⚡ Admin</Link>
            )}
          </div>

          {/* ── Right side (desktop: icons + profile | mobile: profile only) */}
          <div style={{ marginLeft: 'auto', display:'flex', alignItems:'center', gap: 6 }}>
            {/* Notifications */}
            <Link href="/notifications" style={{
              position: 'relative', width: 36, height: 36, borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.65)', fontSize: 16, textDecoration: 'none',
            }}>
              🔔
              {notifCount > 0 && (
                <span style={{
                  position:'absolute', top: 5, right: 5,
                  width: 8, height: 8, borderRadius: '50%', background:'#DC2626',
                }}/>
              )}
            </Link>

            {/* Settings – desktop only */}
            <Link href="/settings" className="st-desktop-nav" style={{
              width: 36, height: 36, borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.12)',
              alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.65)', fontSize: 16, textDecoration: 'none',
            }}>⚙</Link>

            {/* Profile avatar */}
            <Link href="/profile" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 10px 5px 5px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 7, textDecoration: 'none',
            }}>
              <div style={{
                width: 30, height: 30, background: S.gold, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: S.navy, flexShrink: 0,
              }}>{initials}</div>
              <div className="st-desktop-nav" style={{ flexDirection:'column' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>
                  {profile?.full_name?.split(' ')[0] ?? '…'}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  {fmtRank(profile?.rank)}
                </div>
              </div>
            </Link>

            {/* Sign out – desktop only */}
            <button onClick={handleSignOut} title="Sign out" className="st-desktop-nav" style={{
              width: 36, height: 36, borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent', cursor: 'pointer',
              alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)', fontSize: 16,
            }}>⏻</button>
          </div>
        </nav>

        {/* ════════════════════════════════════════════════════════════
            PAGE CONTENT
        ════════════════════════════════════════════════════════════ */}
        <main className="st-page" style={{ flex: 1, maxWidth: 1140, width: '100%', margin: '0 auto' }}>
          {children}
        </main>

        {/* ════════════════════════════════════════════════════════════
            BOTTOM TAB BAR  (mobile only)
        ════════════════════════════════════════════════════════════ */}
        <nav className="st-mobile-bar" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          height: 68, background: S.navy,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          alignItems: 'center', justifyContent: 'space-around',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {BOTTOM_TABS.map(tab => {
            if (tab.href === '__more__') {
              return (
                <button key="more" onClick={() => setShowMore(v => !v)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 3, background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px 12px', borderRadius: 10,
                  color: (showMore || isMoreActive) ? S.gold : 'rgba(255,255,255,0.45)',
                }}>
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 600 }}>{tab.label}</span>
                </button>
              )
            }
            const active = pathname === tab.href ||
              (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
            return (
              <Link key={tab.href} href={tab.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 3, textDecoration: 'none', padding: '6px 12px', borderRadius: 10,
                color: active ? S.gold : 'rgba(255,255,255,0.45)',
              }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{tab.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* ════════════════════════════════════════════════════════════
            MORE DRAWER  (slides up on mobile)
        ════════════════════════════════════════════════════════════ */}
        {showMore && (
          <>
            {/* Backdrop */}
            <div onClick={() => setShowMore(false)} style={{
              position: 'fixed', inset: 0, zIndex: 150,
              background: 'rgba(0,0,0,0.45)',
            }}/>
            {/* Sheet */}
            <div style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
              background: S.navy, borderRadius: '20px 20px 0 0',
              padding: '16px 16px 32px',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.35)',
            }}>
              {/* Handle */}
              <div style={{
                width: 40, height: 4, borderRadius: 2,
                background: 'rgba(255,255,255,0.2)',
                margin: '0 auto 20px',
              }}/>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {MORE_LINKS.map(link => {
                  const active = pathname.startsWith(link.href)
                  return (
                    <Link key={link.href} href={link.href} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 6, padding: '14px 6px', borderRadius: 12,
                      textDecoration: 'none',
                      background: active ? 'rgba(212,160,23,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${active ? 'rgba(212,160,23,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      color: active ? S.gold : 'rgba(255,255,255,0.75)',
                    }}>
                      <span style={{ fontSize: 22 }}>{link.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'center' }}>{link.label}</span>
                    </Link>
                  )
                })}

                {/* Leader/Admin extras */}
                {(profile?.role === 'leader' || profile?.role === 'admin') && (
                  <Link href="/verify" style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 6, padding: '14px 6px', borderRadius: 12,
                    textDecoration: 'none',
                    background: pathname === '/verify' ? 'rgba(212,160,23,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${pathname === '/verify' ? 'rgba(212,160,23,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    color: pathname === '/verify' ? S.gold : 'rgba(255,255,255,0.75)',
                  }}>
                    <span style={{ fontSize: 22 }}>✅</span>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>Verify</span>
                  </Link>
                )}
                {profile?.role === 'admin' && (
                  <Link href="/admin/dashboard" style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 6, padding: '14px 6px', borderRadius: 12,
                    textDecoration: 'none',
                    background: 'rgba(212,160,23,0.12)',
                    border: '1px solid rgba(212,160,23,0.3)',
                    color: S.gold,
                  }}>
                    <span style={{ fontSize: 22 }}>⚡</span>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>Admin</span>
                  </Link>
                )}

                {/* Sign out */}
                <button onClick={handleSignOut} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 6, padding: '14px 6px', borderRadius: 12,
                  background: 'rgba(220,38,38,0.1)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  color: '#FCA5A5', cursor: 'pointer',
                }}>
                  <span style={{ fontSize: 22 }}>⏻</span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>Sign out</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
