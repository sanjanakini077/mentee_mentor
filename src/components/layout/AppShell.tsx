'use client'

import React, { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { ToastProvider } from '@/components/ui/Toast'
import type { Profile, Role } from '@/types'

export interface AppShellProps {
  role: Role
  user: Profile
  isPreview?: boolean
  children: React.ReactNode
}

export function AppShell({
  role,
  user,
  isPreview = false,
  children,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <ToastProvider>
      <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-800">
        {/* Sidebar Component with Desktop & Mobile variants */}
        <Sidebar
          role={role}
          user={user}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          isPreview={isPreview}
        />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar
            user={user}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}

