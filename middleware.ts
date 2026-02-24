import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
    // Bloquer les clients de l'admin
    if (user.user_metadata?.role === 'client') {
      const url = request.nextUrl.clone()
      url.pathname = '/espace-client/dashboard'
      return NextResponse.redirect(url)
    }
  }

  if (isAdminLoginPage && user && user.user_metadata?.role !== 'client') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  // --- Routes espace client ---
  const isClientDashboard = pathname.startsWith('/espace-client/dashboard')
  const isClientLoginPage = pathname === '/espace-client'

  // Protéger le dashboard uniquement (la page mot de passe gère l'auth côté client via hash fragment)
  if (isClientDashboard && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/espace-client'
    return NextResponse.redirect(url)
  }

  // Rediriger vers dashboard si déjà connecté (sauf admin)
  if (isClientLoginPage && user) {
    const role = user.user_metadata?.role
    if (role === 'client') {
      const url = request.nextUrl.clone()
      url.pathname = '/espace-client/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/espace-client/:path*'],
}
