'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Bell,
  Check,
  CheckCheck,
  AlertCircle,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  getProfileNotifications,
  markNotificationAsRead,
  markAllProfileNotificationsAsRead,
} from '@/lib/services/notificationService'
import { getStore, getCurrentUser } from '@/lib/storage/demoStore'
import { formatDateTime } from '@/lib/utils'
import type { AppNotification } from '@/types'

export default function AdminNotificationsPage() {
  const { success, error: toastError } = useToast()

  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [adminId, setAdminId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [isProcessing, setIsProcessing] = useState(false)

    const loadData = useCallback(async () => {
      try {
        const store = getStore()
        const user = getCurrentUser()
        const admin =
          store.profiles.find((p) => p.id === user?.id || p.email === 'hod@demo.com') ||
          store.profiles.find((p) => p.role === 'administrator' || (p.role as string) === 'hod') ||
          store.profiles[0]

        setAdminId(admin.id)
        const list = await getProfileNotifications(admin.id)
        setNotifications(list)
      } catch (err: any) {
        toastError(err?.message || 'Failed to load notifications.')
      } finally {
        setIsLoading(false)
      }
  }, [toastError])

    useEffect(() => {
      loadData()
      window.addEventListener('mms-store-changed', loadData)
      return () => window.removeEventListener('mms-store-changed', loadData)
}, [loadData])

const filtered = useMemo(() => {
  if (filter === 'unread') {
    return notifications.filter((n) => !n.is_read && !n.read)
  }
  return notifications
}, [notifications, filter])

const unreadCount = notifications.filter((n) => !n.is_read && !n.read).length

const handleMarkOne = async (id: string) => {
  try {
    const ok = await markNotificationAsRead(id)
    if (ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read: true } : n))
      )
      success('Notification marked as read.')
    }
  } catch (err: any) {
    toastError(err?.message || 'Could not update notification.')
  }
}

const handleMarkAll = async () => {
  if (!adminId) return
  setIsProcessing(true)

  try {
    const ok = await markAllProfileNotificationsAsRead(adminId)
    if (ok) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read: true }))
      )
      success('All administrative notifications marked as read.')
    }
  } catch (err: any) {
    toastError(err?.message || 'Could not update notifications.')
  } finally {
    setIsProcessing(false)
  }
}

if (isLoading) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

return (
  <div className="space-y-6">
    <PageHeader
      title="Department Administrative Alerts"
      description="Incoming student submissions, faculty recommendations, and institutional notices."
      breadcrumbs={[
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Notifications' },
      ]}
      badge={
        unreadCount > 0 ? (
          <Badge variant="warning">{unreadCount} Unread</Badge>
        ) : (
          <Badge variant="success">All Caught Up</Badge>
        )
      }
      actions={
        unreadCount > 0 ? (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<CheckCheck size={14} />}
            onClick={handleMarkAll}
            isLoading={isProcessing}
          >
            Mark All Read
          </Button>
        ) : undefined
      }
    />

    {/* Filter Tabs */}
    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
      <button
        onClick={() => setFilter('all')}
        className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors ${filter === 'all'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100'
          }`}
      >
        All Notifications ({notifications.length})
      </button>
      <button
        onClick={() => setFilter('unread')}
        className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors ${filter === 'unread'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100'
          }`}
      >
        Unread Only ({unreadCount})
      </button>
    </div>

    {/* Notifications List */}
    {filtered.length === 0 ? (
      <div className="p-12 bg-white border border-slate-200 rounded-md text-center space-y-2 shadow-xs">
        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Bell size={20} />
        </div>
        <p className="text-xs font-semibold text-slate-700">
          {filter === 'unread' ? 'No unread notifications' : 'No notifications on record'}
        </p>
        <p className="text-[11px] text-slate-400">
          Student verification submissions and faculty recommendations will arrive here.
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {filtered.map((item) => {
          const isUnread = !item.is_read && !item.read
          return (
            <div
              key={item.id}
              className={`p-4 bg-white border rounded-md shadow-xs transition-colors ${isUnread ? 'border-blue-200 bg-blue-50/20' : 'border-slate-200'
                }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.type === 'success'
                        ? 'bg-emerald-100 text-emerald-700'
                        : item.type === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : item.type === 'danger'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                  >
                    {item.type === 'success' ? (
                      <CheckCircle2 size={16} />
                    ) : item.type === 'warning' ? (
                      <AlertTriangle size={16} />
                    ) : item.type === 'danger' ? (
                      <AlertCircle size={16} />
                    ) : (
                      <Info size={16} />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">
                        {item.title}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono block pt-1">
                      {formatDateTime(item.created_at || '')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {item.related_entity_type === 'student_profiles' && (
                    <Link href="/admin/reviews">
                      <Button size="sm" variant="ghost" className="text-xs h-7 gap-1">
                        Open Review Queue <ExternalLink size={11} />
                      </Button>
                    </Link>
                  )}
                  {item.related_entity_type === 'mentor_recommendations' && (
                    <Link href="/admin/recommendations">
                      <Button size="sm" variant="ghost" className="text-xs h-7 gap-1">
                        Review Recommendation <ExternalLink size={11} />
                      </Button>
                    </Link>
                  )}
                  {isUnread && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkOne(item.id)}
                      className="text-xs h-7 text-slate-600"
                    >
                      <Check size={12} className="mr-1" /> Mark Read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )}
  </div>
)
}

