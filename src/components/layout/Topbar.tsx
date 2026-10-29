'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Menu,
  ChevronDown,
  User as UserIcon,
  LogOut,
  CheckCircle,
  Clock,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react'
import type { Profile, AppNotification } from '@/types'
import { createClient } from '@/lib/supabase/client'
import {
  getProfileNotifications,
  markNotificationAsRead,
  markAllProfileNotificationsAsRead,
} from '@/lib/services/notificationService'
import { formatDateTime } from '@/lib/utils'

interface TopbarProps {
  user: Profile
  onOpenMobileMenu?: () => void
  pageTitle?: string
}

export function Topbar({ user, onOpenMobileMenu, pageTitle }: TopbarProps) {
  const router = useRouter()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Load real notifications from Supabase
    const loadNotifications = useCallback(async () => {
      if (user?.id) {
        const list = await getProfileNotifications(user.id)
        setNotifications(list)
      }
  }, [user?.id])

    useEffect(() => {
      loadNotifications()
      // Poll notifications every 30s as a gentle background refresh
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
}, [loadNotifications])

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

const unreadCount = notifications.filter((n) => !n.is_read && !n.read).length

const handleNotificationClick = async (notif: AppNotification) => {
  await markNotificationAsRead(notif.id)
  setNotifications((prev) =>
    prev.map((n) => (n.id === notif.id ? { ...n, is_read: true, read: true } : n))
  )
  setNotificationsOpen(false)

  // Route dynamically based on entity and user role
  const role = user.role
  if (notif.related_entity_type === 'student_profiles') {
    if (role === 'administrator' || (role as string) === 'hod') {
      router.push('/admin/reviews')
    } else if (role === 'mentor') {
      router.push(notif.related_entity_id ? `/mentor/students/${notif.related_entity_id}` : '/mentor/students')
    } else {
      router.push('/mentee/verification')
    }
  } else if (notif.related_entity_type === 'mentor_recommendations') {
    if (role === 'administrator' || (role as string) === 'hod') {
      router.push('/admin/recommendations')
    } else if (role === 'mentor') {
      router.push('/mentor/recommendations')
    } else {
      router.push('/mentee/mentor')
    }
  } else if (notif.related_entity_type === 'mentor_assignments') {
    if (role === 'mentor') {
      router.push('/mentor/students')
    } else if (role === 'mentee') {
      router.push('/mentee/mentor')
    } else {
      router.push('/admin/assignments')
    }
  }
}

const handleMarkAllRead = async () => {
  if (!user?.id) return
  await markAllProfileNotificationsAsRead(user.id)
  setNotifications((prev) =>
    prev.map((n) => ({ ...n, is_read: true, read: true }))
  )
}

const notificationsUrl =
  user.role === 'administrator' || (user.role as string) === 'hod'
    ? '/admin/notifications'
    : user.role === 'mentor'
      ? '/mentor/notifications'
      : '/mentee/notifications'

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
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {notificationsOpen && (
          <div className="absolute right-0 mt-2 w-84 bg-white border border-slate-200 rounded-md shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-800">
                Institutional Alerts
              </p>
              <span className="text-[10px] bg-blue-50 text-accent font-semibold px-2 py-0.5 rounded">
                {unreadCount} unread
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No active notifications.
                </div>
              ) : (
                notifications.slice(0, 6).map((n) => {
                  const isUnread = !n.is_read && !n.read
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${isUnread ? 'bg-blue-50/40' : ''
                        }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">
                          {n.type === 'success' ? (
                            <CheckCircle size={13} className="text-emerald-600" />
                          ) : n.type === 'warning' ? (
                            <AlertTriangle size={13} className="text-amber-600" />
                          ) : n.type === 'danger' ? (
                            <AlertCircle size={13} className="text-rose-600" />
                          ) : (
                            <Info size={13} className="text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-[11px] truncate">
                            {n.title}
                          </p>
                          <p className="text-slate-500 text-[11px] mt-0.5 leading-snug line-clamp-2">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                            {formatDateTime(n.created_at || '')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="px-3 pt-2 pb-1 border-t border-slate-100 flex items-center justify-between text-xs">
              {unreadCount > 0 ? (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium text-slate-600 hover:text-slate-900"
                >
                  Mark all read
                </button>
              ) : <span />}
              <Link
                href={notificationsUrl}
                onClick={() => setNotificationsOpen(false)}
                className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1"
              >
                View All <ExternalLink size={10} />
              </Link>
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
          <ChevronDown size={14} className="text-slate-400" />
        </button>

        {profileOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="font-semibold text-slate-900">{user.full_name}</p>
              <p className="text-[11px] text-slate-500 font-mono truncate">
                {user.email}
              </p>
              <span className="inline-block mt-1 text-[10px] uppercase font-bold text-accent bg-blue-50 px-1.5 py-0.5 rounded">
                {user.role}
              </span>
            </div>

            <div className="py-1">
              <Link
                href={
                  user.role === 'mentee'
                    ? '/mentee/profile'
                    : user.role === 'mentor'
                      ? '/mentor/students'
                      : '/admin/students'
                }
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50"
              >
                <UserIcon size={14} className="text-slate-400" />
                <span>My Profile & Settings</span>
              </Link>
            </div>

            <div className="border-t border-slate-100 pt-1">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
              >
                <LogOut size={14} />
                <span>Sign Out of ERP</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </header>
)
}
