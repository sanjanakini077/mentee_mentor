'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { logoutDemoUser } from '@/lib/storage/demoStore'

export function SignOutButton() {
  const router = useRouter()

  function handleSignOut() {
    logoutDemoUser()
    router.push('/auth/sign-in')
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 rounded-md hover:bg-slate-100 hover:text-slate-700 transition-colors"
    >
      <LogOut size={14} className="shrink-0" />
      <span>Sign Out</span>
    </button>
  )
}
