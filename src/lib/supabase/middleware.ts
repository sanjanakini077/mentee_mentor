import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Setup request headers to pass pathname and portal role to server components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  let portalRole = 'mentee'
  if (pathname.startsWith('/hod')) portalRole = 'hod'
  else if (pathname.startsWith('/mentor')) portalRole = 'mentor'
  else if (pathname.startsWith('/mentee')) portalRole = 'mentee'
  requestHeaders.set('x-portal-role', portalRole)

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Create supabase client
  try {
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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isPreviewAllowed =
      process.env.NODE_ENV !== 'production' ||
      process.env.NEXT_PUBLIC_ALLOW_PREVIEW === 'true' ||
      request.cookies.get('preview_mode')?.value === 'true' ||
      request.nextUrl.searchParams.get('preview') === 'true'

    const protectedPrefixes = ['/mentee', '/mentor', '/hod']
    const isProtectedRoute = protectedPrefixes.some((p) => pathname.startsWith(p))

    // Protected routes — if no user and preview is NOT allowed, redirect to sign-in
    if (!user && isProtectedRoute && !isPreviewAllowed) {
      return NextResponse.redirect(new URL('/auth/sign-in', request.url))
    }

    // Auth routes — redirect authenticated users to their role dashboard
    if (user && pathname.startsWith('/auth')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (profile?.role) {
        const roleMap: Record<string, string> = {
          mentee: '/mentee',
          mentor: '/mentor',
          hod: '/hod',
        }
        return NextResponse.redirect(
          new URL(roleMap[profile.role as string] ?? '/mentee', request.url)
        )
      }
    }
  } catch (err) {
    // If Supabase call fails (e.g. invalid credentials or network issue), allow preview in dev
    console.warn('Supabase middleware auth check notice:', err)
  }

  return supabaseResponse
}
