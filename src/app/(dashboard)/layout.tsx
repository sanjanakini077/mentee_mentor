import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import type { Profile, Role } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Authenticate user with Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in')
  }

  // Retrieve user's verified profile record
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single<Profile>()

  // If user exists in Auth but has no profile row yet, construct a safe fallback profile
  const userProfile: Profile = profile || {
    id: user.id,
    user_id: user.id,
    role: (user.user_metadata?.role as Role) || 'mentee',
    full_name:
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Authorized User',
    email: user.email || '',
    department: user.user_metadata?.department || 'General Engineering',
    created_at: user.created_at,
    updated_at: user.created_at,
  }

  const normalizedRole: Role =
    userProfile.role === 'hod' || userProfile.role === 'administrator'
      ? 'administrator'
      : userProfile.role

  return (
    <AppShell role={normalizedRole} user={userProfile} isPreview={false}>
      {children}
    </AppShell>
  )
}
