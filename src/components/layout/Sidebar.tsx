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
  Bell,
  ScrollText,
  X,
  GraduationCap,
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
    { label: 'Dashboard', href: '/mentee/dashboard', icon: LayoutDashboard },
    { label: 'My Profile', href: '/mentee/profile', icon: User },
    { label: 'Academic Records', href: '/mentee/academics', icon: BookOpen },
    { label: 'My Mentor', href: '/mentee/mentor', icon: UserCheck },
    { label: 'Verification Desk', href: '/mentee/verification', icon: CheckSquare },
    { label: 'Notifications', href: '/mentee/notifications', icon: Bell },
  ],
  mentor: [
    { label: 'Dashboard', href: '/mentor/dashboard', icon: LayoutDashboard },
    { label: 'Assigned Students', href: '/mentor/students', icon: Users },
    { label: 'Mentoring Notes', href: '/mentor/notes', icon: FileText },
    { label: 'Recommendations', href: '/mentor/recommendations', icon: ThumbsUp },
    { label: 'Notifications', href: '/mentor/notifications', icon: Bell },
  ],
  administrator: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Student Directory', href: '/admin/students', icon: Users },
    { label: 'Faculty Directory', href: '/admin/faculty', icon: UserCheck },
    { label: 'Review Workspace', href: '/admin/reviews', icon: CheckSquare },
    { label: 'Mentor Allocation', href: '/admin/assignments', icon: ClipboardList },
    { label: 'Recommendations', href: '/admin/recommendations', icon: ThumbsUp },
    { label: 'Audit Trail', href: '/admin/audit-log', icon: ScrollText },
    { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  ],
  hod: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Student Directory', href: '/admin/students', icon: Users },
    { label: 'Faculty Directory', href: '/admin/faculty', icon: UserCheck },
    { label: 'Review Workspace', href: '/admin/reviews', icon: CheckSquare },
    { label: 'Mentor Allocation', href: '/admin/assignments', icon: ClipboardList },
    { label: 'Recommendations', href: '/admin/recommendations', icon: ThumbsUp },
    { label: 'Audit Trail', href: '/admin/audit-log', icon: ScrollText },
    { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  ],
}

const roleLabels: Record<Role, string> = {
  mentee: 'Student Portal',
  mentor: 'Faculty Mentor',
  administrator: 'HOD Administration',
  hod: 'HOD Administration',
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
}: SidebarProps) {
  const pathname = usePathname()
  const normalizedRole: Role =
    role === 'hod' || role === 'administrator' ? 'administrator' : role
  const items = navItems[normalizedRole] || navItems.mentee

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
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

      {/* Role Badge Indicator */}
      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Portal Scope
        </span>
        <Badge
          variant={
            normalizedRole === 'administrator'
              ? 'purple'
              : normalizedRole === 'mentor'
                ? 'primary'
                : 'success'
          }
          className="text-[10px] py-0 px-1.5"
        >
          {roleLabels[normalizedRole]}
        </Badge>
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

      {/* Authenticated User Account Footer */}
      <div className="border-t border-slate-200 p-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-slate-700">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {user.full_name}
            </p>
            <p className="text-[10px] text-slate-500 truncate font-mono">
              {user.email}
            </p>
          </div>
        </div>

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
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
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
