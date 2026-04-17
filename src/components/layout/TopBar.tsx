'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/activities':    'Activities',
  '/goals':         'Goals',
  '/leaderboard':   'Leaderboard',
  '/team':          'Team',
  '/recognition':   'Recognition',
  '/verify':        'Verify Queue',
  '/ai-coach':      'AI Coach',
  '/notifications': 'Notifications',
  '/settings':      'Settings',
}

function getTitle(pathname: string): string {
  if (pathname.startsWith('/activities/submit')) return 'Submit Activity'
  if (pathname.startsWith('/activities/'))       return 'Activity Detail'
  if (pathname.startsWith('/goals/create'))      return 'New Goal'
  if (pathname.startsWith('/goals/'))            return 'Goal Detail'
  if (pathname.startsWith('/profile/'))          return 'Member Profile'
  if (pathname.startsWith('/admin'))             return 'Admin Panel'
  return ROUTE_TITLES[pathname] ?? 'Stark Team'
}

export default function TopBar() {
  const pathname = usePathname()
  const title    = getTitle(pathname)

  return (
    <header
      className="flex items-center justify-between px-6 flex-shrink-0"
      style={{
        height: 48,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        minHeight: 48,
        maxHeight: 48,
      }}>
      {/* Left: gold dot + page title */}
      <div className="flex items-center gap-2.5">
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: 'var(--gold)', boxShadow: '0 0 6px rgba(201,168,76,0.5)' }}
        />
        <h2
          className="text-[13px] font-semibold tracking-[0.06em]"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}>
          {title}
        </h2>
      </div>

      {/* Right: notifications bell */}
      <Link href="/notifications"
        className="flex items-center justify-center w-8 h-8 rounded-[6px] transition-all"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>◉</span>
      </Link>
    </header>
  )
}
