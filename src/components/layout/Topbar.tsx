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
  RotateCcw,
  GraduationCap,
  Users,
  ShieldCheck,
} from 'lucide-react'
import type { Profile, AppNotification } from '@/types'
import {
  getProfileNotifications,
  markNotificationAsRead,
  markAllProfileNotificationsAsRead,
} from '@/lib/services/notificationService'
import {
  logoutAction,
  loginAction,
  resetDemoDataAction,
} from '@/lib/actions/authActions'
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
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const loadNotifications = useCallback(async () => {
    if (user?.id) {
      const list = await getProfileNotifications(user.id)
      setNotifications(list)
    }
  }, [user?.id])

  useEffect(() => {
    loadNotifications()
    const handleStoreChange = () => {
      loadNotifications()
    }
    window.addEventListener('mms-store-changed', handleStoreChange)
    return () => window.removeEventListener('mms-store-changed', handleStoreChange)
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
    await logoutAction()
    router.push('/auth/sign-in')
    router.refresh()
  }

  const handleQuickSwitch = async (role: 'student' | 'mentor' | 'hod') => {
    await loginAction(role, 'demo123')
    setProfileOpen(false)
    if (role === 'student') router.push('/mentee/dashboard')
    else if (role === 'mentor') router.push('/mentor/dashboard')
    else router.push('/admin/dashboard')
    router.refresh()
  }

  const handleConfirmReset = async () => {
    await resetDemoDataAction()
    setResetDialogOpen(false)
    window.location.reload()
  }

  const unreadCount = notifications.filter((n) => !n.is_read && !n.read).length

  const handleNotificationClick = async (notif: AppNotification) => {
    await markNotificationAsRead(notif.id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, is_read: true, read: true } : n))
    )
    setNotificationsOpen(false)

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
    <>
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Open mobile menu"
            >
              <Menu size={18} />
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Academic Session 2024–25
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-xs font-medium text-slate-600 truncate max-w-xs sm:max-w-md">
              {pageTitle || user.department}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reset Demo Data Trigger */}
          <button
            type="button"
            onClick={() => setResetDialogOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
            title="Reset browser demo dataset back to initial defaults"
          >
            <RotateCcw size={12} className="text-slate-500" />
            <span>Reset Demo Data</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((prev) => !prev)
                setProfileOpen(false)
              }}
              className="relative p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="View notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-xs">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 font-bold text-[10px] rounded-full">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
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
                          className={`p-3 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                            isUnread ? 'bg-blue-50/40' : ''
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
                  ) : (
                    <span />
                  )}
                  <Link
                    href={notificationsUrl}
                    onClick={() => setNotificationsOpen(false)}
                    className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
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
              <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold">
                {initials}
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                {user.full_name}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-900">{user.full_name}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    {user.email}
                  </p>
                  <span className="inline-block mt-1 text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    {user.role}
                  </span>
                </div>

                {/* Quick Role Switcher for Demo */}
                <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">
                    Demo Role Switch
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickSwitch('student')}
                      className={`px-1.5 py-1 text-[11px] rounded font-medium transition-colors ${
                        user.role === 'mentee'
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSwitch('mentor')}
                      className={`px-1.5 py-1 text-[11px] rounded font-medium transition-colors ${
                        user.role === 'mentor'
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Faculty
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSwitch('hod')}
                      className={`px-1.5 py-1 text-[11px] rounded font-medium transition-colors ${
                        user.role === 'administrator' || (user.role as string) === 'hod'
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      HOD
                    </button>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      setResetDialogOpen(true)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 text-left font-medium"
                  >
                    <RotateCcw size={14} className="text-slate-400" />
                    <span>Reset Demo Data</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                  >
                    <LogOut size={14} />
                    <span>Sign Out of Demo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Confirmation Dialog for Reset Demo Data */}
      {resetDialogOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <RotateCcw size={18} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Reset Demo Dataset?
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  This will restore all student profiles, academic records, notes, and recommendations to the fresh default demo state.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setResetDialogOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
              >
                Yes, Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
