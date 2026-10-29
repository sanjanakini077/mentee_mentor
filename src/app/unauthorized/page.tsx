'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import type { Profile, Role } from '@/types'

const roleDashboardMap: Record<string, string> = {
  mentee: '/mentee/dashboard',
  mentor: '/mentor/dashboard',
  administrator: '/admin/dashboard',
  hod: '/admin/dashboard',
}

const roleNames: Record<string, string> = {
  mentee: 'Student (Mentee)',
  mentor: 'Faculty Mentor',
  administrator: 'HOD / Administrator',
  hod: 'HOD / Administrator',
}

function UnauthorizedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requiredRole = searchParams.get('requiredRole') || 'authorized'
  const userRoleParam = searchParams.get('userRole')

  const [profile, setProfile] = useState<Profile | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single<Profile>()

          if (data) {
            setProfile(data)
          }
        }
      } catch (err) {
        console.error('Error fetching user on unauthorized page:', err)
      }
    }

    loadUser()
  }, [])

  const currentRole = profile?.role || (userRoleParam as Role) || 'mentee'
  const myDashboard = roleDashboardMap[currentRole] || '/mentee/dashboard'

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } finally {
      router.push('/auth/sign-in')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-md shadow-sm p-7 text-center space-y-5">
        {/* Shield Icon */}
        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert size={28} />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-lg font-bold text-slate-900 mt-2 tracking-tight">
            Unauthorized Portal Access
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Your authenticated account does not possess the required institutional
            permissions to view this departmental portal.
          </p>
        </div>

        {/* User Context Box */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded text-left text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Signed-in as:</span>
            <span className="font-semibold text-slate-800">
              {profile ? profile.full_name : 'Authenticated User'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Your Assigned Role:</span>
            <span className="font-semibold text-slate-800 font-mono">
              {roleNames[currentRole] || currentRole}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Required Portal Role:</span>
            <span className="font-semibold text-rose-600 font-mono">
              {roleNames[requiredRole] || requiredRole}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <Link href={myDashboard} className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              leftIcon={<ArrowLeft size={15} />}
              className="w-full"
            >
              Go to My Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            size="md"
            leftIcon={<LogOut size={15} />}
            isLoading={isSigningOut}
            onClick={handleSignOut}
            className="w-full sm:w-auto text-slate-700"
          >
            Sign Out
          </Button>
        </div>

        <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          Need role elevation? Contact the Department Head or System Administrator.
        </p>
      </div>
    </div>
  )
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  )
}
