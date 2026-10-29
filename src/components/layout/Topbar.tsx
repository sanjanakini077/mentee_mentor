'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
  Menu,
  ChevronDown,
  User as UserIcon,
  LogOut,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react'
import type { Profile } from '@/types'
import { PREVIEW_NOTIFICATIONS } from '@/lib/preview-data'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface TopbarProps {
  user: Profile
  onOpenMobileMenu?: () => void
  pageTitle?: string
}

export function Topbar({ user, onOpenMobileMenu, pageTitle }: TopbarProps) {
  const router = useRouter()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } finally {
      router.push('/auth/sign-in')
      router.refresh()
    }
  }

  const unreadCount = PREVIEW_NOTIFICATIONS.filter((n) => !n.read).length

  return (
    <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-20">
      {/* Left: Mobile hamburger & Context title */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Academic Session 2024–25
          </span>
          {pageTitle && (
            <>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="text-xs font-semibold text-slate-800">
                {pageTitle}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Notifications & Profile Menu */}
      <div className="flex items-center gap-2">
        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((prev) => !prev)
              setProfileOpen(false)
            }}
            aria-label="View notifications"
            className="relative w-8 h-8 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent ring-2 ring-white" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-md shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-800">
                  Notifications
                </p>
                <span className="text-[10px] bg-blue-50 text-accent font-medium px-1.5 py-0.5 rounded">
                  {unreadCount} unread
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {PREVIEW_NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 text-xs hover:bg-slate-50 transition-colors ${
                      !n.read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'success' ? (
                          <CheckCircle size={13} className="text-emerald-600" />
                        ) : (
                          <Clock size={13} className="text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-[11px]">
                          {n.title}
                        </p>
                        <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {n.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-3 pt-2 pb-1 border-t border-slate-100 text-center">
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[11px] font-medium text-accent hover:underline"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown Menu */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen((prev) => !prev)
              setNotificationsOpen(false)
            }}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-md hover:bg-slate-100 transition-colors"
            aria-label="User profile menu"
          >
            <div className="w-7 h-7 rounded-full bg-accent-light border border-accent/20 flex items-center justify-center text-accent text-xs font-bold">
              {initials}
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 max-w-[120px] truncate">
              {user.full_name}
            </span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-md shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {user.full_name}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {user.email}
                </p>
                <div className="mt-1.5 inline-block text-[10px] font-semibold text-accent bg-blue-50 px-1.5 py-0.5 rounded uppercase">
                  {user.role}
                </div>
              </div>

              <div className="py-1">
                <Link
                  href={
                    user.role === 'mentee'
                      ? '/mentee/profile'
                      : user.role === 'mentor'
                      ? '/mentor'
                      : '/hod'
                  }
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <UserIcon size={14} className="text-slate-400" />
                  <span>My Profile Details</span>
                </Link>
                <Link
                  href="/auth/sign-in"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Sparkles size={14} className="text-slate-400" />
                  <span>Switch Role / Sign In</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
