import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES  = ['/login', '/signup', '/forgot-password', '/reset-password']
const ADMIN_ROUTES   = ['/admin']
const LEADER_ROUTES  = ['/verify']

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http') &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_')

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const path = request.nextUrl.pathname

  // If Supabase is not configured yet, allow access to login page only
  if (!SUPABASE_CONFIGURED) {
    if (!PUBLIC_ROUTES.some(r => path.startsWith(r)) && !path.startsWith('/api')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in — redirect to login (except public routes)
  if (!user && !PUBLIC_ROUTES.some(r => path.startsWith(r))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Already logged in — redirect away from auth pages
  if (user && PUBLIC_ROUTES.some(r => path.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Admin route check
  if (user && ADMIN_ROUTES.some(r => path.startsWith(r))) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Leader route check
  if (user && LEADER_ROUTES.some(r => path.startsWith(r))) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'leader' && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
