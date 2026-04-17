'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  {
    section: 'Main',
    items: [
      { href: '/dashboard',   label: 'Dashboard',    icon: '⊞' },
      { href: '/activities',  label: 'Activities',   icon: '⚡' },
      { href: '/goals',       label: 'Goals',        icon: '◎' },
    ],
  },
  {
    section: 'Team',
    items: [
      { href: '/leaderboard', label: 'Leaderboard',  icon: '▲' },
      { href: '/team',        label: 'Members',      icon: '◈' },
      { href: '/recognition', label: 'Recognition',  icon: '✦' },
      { href: '/verify',      label: 'Verify Queue', icon: '✓', leaderOnly: true },
    ],
  },
  {
    section: 'Tools',
    items: [
      { href: '/ai-coach',      label: 'AI Coach',      icon: '◆' },
      { href: '/notifications', label: 'Notifications', icon: '◉' },
      { href: '/settings',      label: 'Settings',      icon: '⊙' },
    ],
  },
]

interface SidebarProps {
  userRole?: string
  userName?: string
  userRank?: string
  avatarUrl?: string
}

export default function Sidebar({ userRole, userName, userRank }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userName
    ? userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        maxWidth: 240,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>

      {/* ── LOGO ─────────────────────────────── */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="hexagon w-9 h-9 flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(160deg, #C9A84C 0%, #E8C96A 100%)' }}>
            <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 13, color: '#07090F' }}>S</span>
          </div>
          <div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--gold)' }}>
              Stark Team
            </div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 1 }}>
              Operations
            </div>
          </div>
        </div>
      </div>

      {/* ── NAV ──────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {NAV.map(group => {
          const visibleItems = group.items.filter(i =>
            !(i as any).leaderOnly || userRole === 'leader' || userRole === 'admin'
          )
          if (!visibleItems.length) return null
          return (
            <div key={group.section}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', paddingLeft: 10, marginBottom: 4 }}>
                {group.section}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {visibleItems.map(item => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link key={item.href} href={item.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 9,
                        padding: '7px 10px',
                        borderRadius: 7,
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: 13,
                        fontWeight: active ? 600 : 400,
                        color: active ? 'var(--gold)' : 'var(--text-secondary)',
                        background: active ? 'rgba(201,168,76,0.08)' : 'transparent',
                        borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
                        textDecoration: 'none',
                        transition: 'all 0.12s',
                      }}>
                      <span style={{ fontSize: 11, width: 16, textAlign: 'center', flexShrink: 0, color: active ? 'var(--gold)' : 'var(--text-muted)' }}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Admin section */}
        {userRole === 'admin' && (
          <div>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', paddingLeft: 10, marginBottom: 4 }}>
              Admin
            </p>
            <Link href="/admin/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '7px 10px',
                borderRadius: 7,
                fontFamily: 'Outfit, sans-serif',
                fontSize: 13,
                fontWeight: pathname.startsWith('/admin') ? 600 : 400,
                color: pathname.startsWith('/admin') ? 'var(--gold)' : 'var(--text-secondary)',
                background: pathname.startsWith('/admin') ? 'rgba(201,168,76,0.08)' : 'transparent',
                borderLeft: pathname.startsWith('/admin') ? '2px solid var(--gold)' : '2px solid transparent',
                textDecoration: 'none',
              }}>
              <span style={{ fontSize: 11, width: 16, textAlign: 'center', flexShrink: 0, color: pathname.startsWith('/admin') ? 'var(--gold)' : 'var(--text-muted)' }}>⚙</span>
              Control Panel
            </Link>
          </div>
        )}
      </nav>

      {/* ── USER FOOTER ──────────────────────── */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--border)' }}>
        {/* User card */}
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div className="hexagon" style={{ width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gold-dim)', color: 'var(--gold)', fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 11 }}>
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName ?? '—'}
              </p>
              <p className="rank-badge" style={{ fontSize: 9, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userRank?.replace(/_/g, ' ')} · {userRole}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '6px 10px', borderRadius: 6, fontFamily: 'Outfit, sans-serif', fontSize: 12, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
          <span style={{ fontSize: 11 }}>⎋</span>
          Sign out
        </button>
      </div>
    </aside>
  )
}
