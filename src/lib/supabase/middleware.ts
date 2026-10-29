import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Validates redirect target to prevent open redirect vulnerabilities
function getSafeRedirectUrl(target: string | null, fallback: string): string {
  if (!target) return fallback
  if (target.startsWith('/') && !target.startsWith('//') && !target.includes('://')) {
    return target
  }
  return fallback
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Setup request headers for downstream server components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // 2. Initialize Supabase Server Client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Authenticate user securely with Supabase Auth server (validates JWT)
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    console.error('Middleware auth check error:', error)
  }

  // Define route classifications
  const isMenteeRoute = pathname.startsWith('/mentee')
  const isMentorRoute = pathname.startsWith('/mentor')
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/hod')
  const isProtectedRoute = isMenteeRoute || isMentorRoute || isAdminRoute
  const isAuthRoute = pathname.startsWith('/auth')
  const isPasswordResetFlow = pathname === '/auth/reset-password' || pathname === '/auth/callback'

  // 4. Handle Unauthenticated Users attempting to access protected routes
  if (!user && isProtectedRoute) {
    const signInUrl = new URL('/auth/sign-in', request.url)
    signInUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // 5. Handle Authenticated Users
  if (user) {
    // Fetch user's verified role and department from the server-side profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, department')
      .eq('user_id', user.id)
      .single()

    const rawRole = profile?.role ? String(profile.role).toLowerCase() : 'mentee'
    const role = (rawRole === 'hod' || rawRole === 'administrator') ? 'administrator' : rawRole

    // Pass trusted identity headers to server components
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-role', role)
    if (profile?.department) {
      requestHeaders.set('x-user-dept', profile.department)
    }

    // Determine canonical dashboard based on verified server-side role
    const canonicalDashboard =
      role === 'administrator'
        ? '/admin/dashboard'
        : role === 'mentor'
        ? '/mentor/dashboard'
        : '/mentee/dashboard'

    // If an authenticated user visits auth pages (sign-in, sign-up, forgot-password),
    // redirect them directly to their role dashboard (except for reset-password flow)
    if (isAuthRoute && !isPasswordResetFlow) {
      const redirectToParam = request.nextUrl.searchParams.get('redirectTo')
      const targetUrl = getSafeRedirectUrl(redirectToParam, canonicalDashboard)
      return NextResponse.redirect(new URL(targetUrl, request.url))
    }

    // 6. Strict Role-Based Route Protection (RBAC)
    // Prevent users from accessing other roles' portals
    if (isMenteeRoute && role !== 'mentee') {
      const unauthorizedUrl = new URL('/unauthorized', request.url)
      unauthorizedUrl.searchParams.set('requiredRole', 'mentee')
      unauthorizedUrl.searchParams.set('userRole', role)
      return NextResponse.redirect(unauthorizedUrl)
    }

    if (isMentorRoute && role !== 'mentor') {
      const unauthorizedUrl = new URL('/unauthorized', request.url)
      unauthorizedUrl.searchParams.set('requiredRole', 'mentor')
      unauthorizedUrl.searchParams.set('userRole', role)
      return NextResponse.redirect(unauthorizedUrl)
    }

    if (isAdminRoute && role !== 'administrator') {
      const unauthorizedUrl = new URL('/unauthorized', request.url)
      unauthorizedUrl.searchParams.set('requiredRole', 'administrator')
      unauthorizedUrl.searchParams.set('userRole', role)
      return NextResponse.redirect(unauthorizedUrl)
    }
  }

  return supabaseResponse
}
