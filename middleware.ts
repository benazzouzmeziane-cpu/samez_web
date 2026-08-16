import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAllowed, isAdminUser } from '@/lib/admin'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // --- Routes admin ---
  const isAdminRoute = pathname.startsWith('/admin')
  const isAdminLoginPage = pathname === '/admin/login'

  if (isAdminRoute && !isAdminLoginPage) {
    if (!user || !isAdminUser(user)) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  if (isAdminLoginPage && user && isAdminUser(user)) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  // --- Routes espace client ---
  const isClientApp =
    pathname.startsWith('/espace-client/dashboard') ||
    pathname.startsWith('/espace-client/documents') ||
    pathname.startsWith('/espace-client/compte')
  const isClientLoginPage = pathname === '/espace-client'

  if (isClientApp && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/espace-client'
    return NextResponse.redirect(url)
  }

  // Admin sur le portail client → renvoyer vers l'admin
  if (isClientApp && user && isAdminAllowed(user.email)) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  if (isClientLoginPage && user) {
    const role = user.app_metadata?.role
    if (role === 'client') {
      const url = request.nextUrl.clone()
      url.pathname = '/espace-client/dashboard'
      return NextResponse.redirect(url)
    }
    if (isAdminUser(user)) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/espace-client', '/espace-client/:path*'],
}
