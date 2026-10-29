'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  User,
  BookOpen,
  CheckSquare,
  Users,
  FileText,
  ThumbsUp,
  ClipboardList,
  UserCheck,
  ScrollText,
  X,
  GraduationCap,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile, Role } from '@/types'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { Badge } from '@/components/ui/Badge'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
}

const navItems: Record<Role, NavItem[]> = {
  mentee: [
    { label: 'Overview', href: '/mentee', icon: LayoutDashboard },
    { label: 'My Profile', href: '/mentee/profile', icon: User },
    { label: 'Academic Records', href: '/mentee/academics', icon: BookOpen },
    { label: 'Verification Status', href: '/mentee/verification', icon: CheckSquare },
    { label: 'My Mentor', href: '/mentee/mentor', icon: UserCheck },
  ],
  mentor: [
    { label: 'Overview', href: '/mentor', icon: LayoutDashboard },
    { label: 'Assigned Students', href: '/mentor/students', icon: Users },
    { label: 'Mentoring Notes', href: '/mentor/notes', icon: FileText },
    { label: 'Recommendations', href: '/mentor/recommendations', icon: ThumbsUp },
  ],
  hod: [
    { label: 'Overview', href: '/hod', icon: LayoutDashboard },
    { label: 'Student Directory', href: '/hod/students', icon: Users },
    { label: 'Mentor Allocation', href: '/hod/assignments', icon: ClipboardList },
    { label: 'Recommendations', href: '/hod/recommendations', icon: ThumbsUp },
    { label: 'Audit Trail', href: '/hod/audit', icon: ScrollText },
  ],
  administrator: [
    { label: 'Overview', href: '/hod', icon: LayoutDashboard },
    { label: 'Student Directory', href: '/hod/students', icon: Users },
    { label: 'Mentor Allocation', href: '/hod/assignments', icon: ClipboardList },
    { label: 'Recommendations', href: '/hod/recommendations', icon: ThumbsUp },
    { label: 'Audit Trail', href: '/hod/audit', icon: ScrollText },
  ],
}

const roleLabels: Record<Role, string> = {
  mentee: 'Student Portal',
  mentor: 'Faculty Mentor',
  hod: 'HOD Administration',
  administrator: 'HOD Administration',
}

interface SidebarProps {
  role: Role
  user: Profile
  isOpen?: boolean
  onClose?: () => void
  isPreview?: boolean
}

export function Sidebar({
  role,
  user,
  isOpen = false,
  onClose,
  isPreview = false,
}: SidebarProps) {
  const pathname = usePathname()
  const items = navItems[role] || navItems.mentee

  const isActive = (href: string) => {
    if (href === `/${role}`) return pathname === href
    return pathname.startsWith(href)
  }

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Institution Brand Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-white font-bold text-xs shadow-xs">
            <GraduationCap size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 tracking-tight leading-tight">
              Mentor–Mentee MS
            </p>
            <p className="text-[10px] text-slate-500 font-medium truncate">
              College of Engineering
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100"
            aria-label="Close navigation sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Portal Role & Quick Switcher */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Current Portal
          </span>
          <Badge
            variant={
              role === 'hod' ? 'purple' : role === 'mentor' ? 'primary' : 'success'
            }
            className="text-[10px] py-0 px-1.5"
          >
            {roleLabels[role]}
          </Badge>
        </div>

        {/* Quick portal navigation links for checking during phase 1 */}
        <div className="mt-2 grid grid-cols-3 gap-1 bg-slate-200/60 p-0.5 rounded text-[10px]">
          <Link
            href="/mentee"
            onClick={onClose}
            className={cn(
              'text-center py-1 rounded transition-colors',
              role === 'mentee'
                ? 'bg-white font-semibold text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Student
          </Link>
          <Link
            href="/mentor"
            onClick={onClose}
            className={cn(
              'text-center py-1 rounded transition-colors',
              role === 'mentor'
                ? 'bg-white font-semibold text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Mentor
          </Link>
          <Link
            href="/hod"
            onClick={onClose}
            className={cn(
              'text-center py-1 rounded transition-colors',
              role === 'hod'
                ? 'bg-white font-semibold text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            HOD
          </Link>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <p className="px-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Navigation
        </p>
        <ul className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors',
                    active
                      ? 'bg-blue-50 text-accent font-semibold border-l-2 border-accent pl-[10px]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      size={16}
                      className={cn(
                        'shrink-0',
                        active ? 'text-accent' : 'text-slate-400'
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-semibold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Information & Sign Out Footer */}
      <div className="border-t border-slate-200 p-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-slate-700">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {user.full_name}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {user.department || 'Computer Science'}
            </p>
          </div>
        </div>

        {isPreview && (
          <div className="mb-2 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800 flex items-center gap-1.5">
            <Sparkles size={11} className="text-amber-600 shrink-0" />
            <span className="truncate">Preview UI Mode active</span>
          </div>
        )}

        <SignOutButton />
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:h-screen md:flex-col md:border-r md:border-slate-200">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Navigation with Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Slide-out Panel */}
          <aside
            className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col z-10 animate-in slide-in-from-left duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
