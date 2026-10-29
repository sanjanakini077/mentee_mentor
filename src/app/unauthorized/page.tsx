'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getCurrentUser, logoutDemoUser } from '@/lib/storage/demoStore'
import type { Profile } from '@/types'

const roleDashboardMap: Record<string, string> = {
  mentee: '/mentee/dashboard',
  mentor: '/mentor/dashboard',
  administrator: '/admin/dashboard',
  hod: '/admin/dashboard',
}

function UnauthorizedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requiredRole = searchParams.get('requiredRole') || 'authorized'
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    setProfile(user)
  }, [])

  const handleSignOut = () => {
    logoutDemoUser()
    router.push('/auth/sign-in')
  }

  const userRole = profile?.role || 'authorized'
  const myDashboard = roleDashboardMap[userRole] || '/mentee/dashboard'

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-md shadow-sm p-8 text-center space-y-5">
      <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
        <ShieldAlert size={26} />
      </div>

      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
          Access Restricted
        </h1>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          This portal view requires{' '}
          <strong className="text-slate-700 capitalize font-semibold">
            {requiredRole}
          </strong>{' '}
          privileges. You are currently authenticated as{' '}
          <strong className="text-slate-700 capitalize font-semibold">
            {profile?.role || 'guest'}
          </strong>
          .
        </p>
      </div>

      <div className="pt-2 flex flex-col gap-2">
        <Link href={myDashboard}>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 text-xs">
            Return to My Workspace
          </Button>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
        >
          Sign Out of Demo
        </button>
      </div>
    </div>
  )
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs text-slate-400">Loading...</div>}>
        <UnauthorizedContent />
      </Suspense>
    </div>
  )
}
