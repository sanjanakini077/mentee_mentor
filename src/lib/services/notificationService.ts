import { getStore, saveStore } from '@/lib/storage/demoStore'
import type { AppNotification, NotificationType } from '@/types'

/**
 * Fetches in-app notifications for profile from demoStore
 */
export async function getProfileNotifications(profileId: string): Promise<AppNotification[]> {
  const store = getStore()
  return store.notifications
    .filter((n) => n.recipient_profile_id === profileId)
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
}

/**
 * Marks an individual notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const store = getStore()
  const notif = store.notifications.find((n) => n.id === notificationId)
  if (notif) {
    notif.is_read = true
    notif.read = true
    saveStore(store)
    return true
  }
  return false
}

/**
 * Marks all notifications as read for a profile
 */
export async function markAllProfileNotificationsAsRead(profileId: string): Promise<boolean> {
  const store = getStore()
  store.notifications.forEach((n) => {
    if (n.recipient_profile_id === profileId) {
      n.is_read = true
      n.read = true
    }
  })
  saveStore(store)
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
  const store = getStore()
  const newNotif: AppNotification = {
    id: `notif-${Date.now()}`,
    recipient_profile_id: params.recipientProfileId,
    title: params.title.trim(),
    message: params.message.trim(),
    type: params.type || 'info',
    related_entity_type: params.relatedEntityType,
    related_entity_id: params.relatedEntityId,
    is_read: false,
    created_at: new Date().toISOString(),
  }
  store.notifications.unshift(newNotif)
  saveStore(store)
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
  const store = getStore()
  const hod = store.profiles.find(
    (p) => p.role === 'administrator' || (p.role as string) === 'hod'
  )

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

/**
 * Sends a notification to the assigned faculty mentor of a student
 */
export async function notifyAssignedMentor(params: {
  studentProfileId: string
  title: string
  message: string
  type?: NotificationType
  relatedEntityType?: string
  relatedEntityId?: string
}): Promise<boolean> {
  const store = getStore()
  const assign = store.mentorAssignments.find(
    (a) => a.student_profile_id === params.studentProfileId && a.is_active
  )

  if (assign && assign.mentor_profile_id) {
    return createInAppNotification({
      recipientProfileId: assign.mentor_profile_id,
      title: params.title,
      message: params.message,
      type: params.type || 'info',
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: params.relatedEntityId,
    })
  }
  return false
}
