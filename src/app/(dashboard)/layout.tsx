import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { PREVIEW_PROFILES } from '@/lib/preview-data'
import type { Profile, Role } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headerList = await headers()
  const headerPortalRole = (headerList.get('x-portal-role') as Role) || 'mentee'

  let activeUser: Profile | null = null
  let isPreview = false

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single<Profile>()

      if (profile) {
        activeUser = profile
      }
    }
  } catch (error) {
    console.warn('Dashboard layout auth check notice:', error)
  }

  // If no authenticated user exists, fallback to preview profile for the current portal
  if (!activeUser) {
    activeUser = PREVIEW_PROFILES[headerPortalRole] || PREVIEW_PROFILES.mentee
    isPreview = true
  }

  // The active role displayed in the sidebar matches the current portal
  const activeRole: Role = headerPortalRole || activeUser.role

  return (
    <AppShell role={activeRole} user={activeUser} isPreview={isPreview}>
      {children}
    </AppShell>
  )
}
