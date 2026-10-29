'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { getCurrentUserAction } from '@/lib/actions/authActions'
import type { Profile, Role } from '@/types'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<Profile | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    let fallback: 'mentee' | 'mentor' | 'administrator' = 'mentee'
    if (pathname.startsWith('/admin') || pathname.startsWith('/hod')) {
      fallback = 'administrator'
    } else if (pathname.startsWith('/mentor')) {
      fallback = 'mentor'
    }

    getCurrentUserAction(fallback).then((currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push('/auth/sign-in')
      }
    })
  }, [router, pathname])

  // Prevent hydration mismatch during SSR
  if (!mounted || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs text-slate-400">Loading Portal...</p>
        </div>
      </div>
    )
  }

  const normalizedRole: Role =
    user.role === 'hod' || user.role === 'administrator'
      ? 'administrator'
      : user.role

  return (
    <AppShell role={normalizedRole} user={user} isPreview={false}>
      {children}
    </AppShell>
  )
}
