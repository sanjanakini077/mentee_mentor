import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const cookieStore = request.cookies
    let response = NextResponse.redirect(`${origin}${next || '/'}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If an explicit next path is provided (e.g., reset-password), follow it
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Otherwise determine canonical dashboard by checking role in profiles table
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        const rawRole = profile?.role ? String(profile.role).toLowerCase() : 'mentee'
        const role = (rawRole === 'hod' || rawRole === 'administrator') ? 'administrator' : rawRole

        const canonicalDashboard =
          role === 'administrator'
            ? '/admin/dashboard'
            : role === 'mentor'
            ? '/mentor/dashboard'
            : '/mentee/dashboard'

        return NextResponse.redirect(`${origin}${canonicalDashboard}`)
      }

      return NextResponse.redirect(`${origin}/`)
    } else {
      console.error('Auth code exchange error:', error)
    }
  }

  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth_callback_failed`)
}
