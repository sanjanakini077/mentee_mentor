'use server'

import prisma from '@/lib/prisma'
import type { AppNotification, NotificationType } from '@/types'

/**
 * Fetches in-app notifications for profile from SQLite via Prisma
 */
export async function getProfileNotifications(profileId: string): Promise<AppNotification[]> {
  const notifs = await prisma.notification.findMany({
    where: { recipient_profile_id: profileId },
    orderBy: { created_at: 'desc' },
  })

  return notifs.map((n) => ({
    id: n.id,
    recipient_profile_id: n.recipient_profile_id,
    title: n.title,
    message: n.message,
    type: n.type as any,
    related_entity_type: n.related_entity_type || undefined,
    related_entity_id: n.related_entity_id || undefined,
    is_read: n.is_read,
    read: n.is_read,
    created_at: n.created_at.toISOString(),
    timestamp: n.created_at.toISOString(),
  }))
}

/**
 * Marks an individual notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { is_read: true },
  })
  return true
}

/**
 * Marks all notifications as read for a profile
 */
export async function markAllProfileNotificationsAsRead(profileId: string): Promise<boolean> {
  await prisma.notification.updateMany({
    where: { recipient_profile_id: profileId },
    data: { is_read: true },
  })
  return true
}

/**
 * Sends a notification to a specific recipient
 */
export async function createInAppNotification(params: {
  recipientProfileId: string
  title: string
  message: string
  type?: NotificationType
  relatedEntityType?: string
  relatedEntityId?: string
}): Promise<boolean> {
  await prisma.notification.create({
    data: {
      recipient_profile_id: params.recipientProfileId,
      title: params.title.trim(),
      message: params.message.trim(),
      type: params.type || 'info',
      related_entity_type: params.relatedEntityType,
      related_entity_id: params.relatedEntityId,
      is_read: false,
    },
  })
  return true
}

/**
 * Sends a notification to the Department Administrator / HOD
 */
export async function notifyDepartmentHOD(params: {
  department: string
  title: string
  message: string
  type?: NotificationType
  relatedEntityType?: string
  relatedEntityId?: string
}): Promise<boolean> {
  const hod = await prisma.profile.findFirst({
    where: {
      OR: [{ role: 'administrator' }, { role: 'hod' }, { email: 'hod@demo.com' }],
    },
  })

  if (hod) {
    return createInAppNotification({
      recipientProfileId: hod.id,
      title: params.title,
      message: params.message,
      type: params.type || 'info',
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: params.relatedEntityId,
    })
  }
  return false
}
