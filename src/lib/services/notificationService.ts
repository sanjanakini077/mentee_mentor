import { createClient } from '@/lib/supabase/client'
import type { AppNotification, NotificationType } from '@/types'

/**
 * Fetches real in-app notifications for the currently authenticated profile
 */
export async function getProfileNotifications(profileId: string): Promise<AppNotification[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(25)

  if (error) {
    console.error('Error fetching profile notifications:', error)
    return []
  }

  return (data as any) || []
}

/**
 * Marks an individual notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification read:', error)
    return false
  }

  return true
}

/**
 * Marks all notifications as read for a profile
 */
export async function markAllProfileNotificationsAsRead(profileId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_profile_id', profileId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications read:', error)
    return false
  }

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
  const supabase = createClient()

  const { error } = await supabase.from('notifications').insert({
    recipient_profile_id: params.recipientProfileId,
    title: params.title.trim(),
    message: params.message.trim(),
    type: params.type || 'info',
    related_entity_type: params.relatedEntityType || null,
    related_entity_id: params.relatedEntityId || null,
    is_read: false,
  })

  if (error) {
    console.error('Failed to create notification:', error)
    return false
  }

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
  const supabase = createClient()

  // Find HOD profile for department
  const { data: hodProfiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('department', params.department)
    .eq('role', 'administrator')

  if (!hodProfiles || hodProfiles.length === 0) {
    // Fallback: notify any administrator
    const { data: anyAdmin } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'administrator')
      .limit(1)

    if (anyAdmin && anyAdmin[0]) {
      return await createInAppNotification({
        recipientProfileId: anyAdmin[0].id,
        ...params,
      })
    }
    return false
  }

  // Send notification to department HOD(s)
  for (const hod of hodProfiles) {
    await createInAppNotification({
      recipientProfileId: hod.id,
      ...params,
    })
  }

  return true
}

/**
 * Sends a notification to the student's actively assigned mentor
 */
export async function notifyAssignedMentor(params: {
  studentProfileId: string
  title: string
  message: string
  type?: NotificationType
  relatedEntityType?: string
  relatedEntityId?: string
}): Promise<boolean> {
  const supabase = createClient()

  const { data: assignment } = await supabase
    .from('mentor_assignments')
    .select('mentor_profile_id')
    .eq('student_profile_id', params.studentProfileId)
    .eq('is_active', true)
    .maybeSingle()

  if (!assignment?.mentor_profile_id) {
    return false
  }

  return await createInAppNotification({
    recipientProfileId: assignment.mentor_profile_id,
    ...params,
  })
}
