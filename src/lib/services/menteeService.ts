import {
  getStore,
  saveStore,
  getCurrentUser,
} from '@/lib/storage/demoStore'
import type {
  Profile,
  StudentProfile,
  AcademicRecord,
  MentorNote,
  MentorRecommendation,
  AppNotification,
  VerificationStatus,
} from '@/types'

export interface MenteeFullData {
  profile: Profile
  studentProfile: StudentProfile
  assignedMentor: Profile | null
  mentorAssignmentDate?: string
  academicRecords: AcademicRecord[]
  mentorNotes: MentorNote[]
  recommendations: MentorRecommendation[]
  notifications: AppNotification[]
  completionRate: number
  missingFields: string[]
}

/**
 * Calculates profile completion percentage and identifies missing fields
 */
export function calculateProfileCompletion(
  profile: Profile | null,
  sp: StudentProfile | null
): { rate: number; missing: string[] } {
  const fields = [
    { name: 'Full Name', value: profile?.full_name },
    { name: 'Institutional Email', value: profile?.email },
    { name: 'Phone Number', value: profile?.phone_number },
    { name: 'USN', value: sp?.usn && sp.usn !== 'UNASSIGNED' ? sp.usn : null },
    { name: 'Department', value: sp?.department || profile?.department },
    { name: 'Semester', value: sp?.semester },
    { name: 'Academic Batch', value: sp?.academic_batch },
    { name: 'Blood Group', value: sp?.blood_group },
    { name: 'Permanent Address', value: sp?.address },
    { name: 'Parent/Guardian Name', value: sp?.parent_name },
    { name: 'Parent Contact Phone', value: sp?.parent_phone },
  ]

  const total = fields.length
  const completed = fields.filter((f) => f.value && String(f.value).trim().length > 0).length
  const missing = fields
    .filter((f) => !f.value || String(f.value).trim().length === 0)
    .map((f) => f.name)

  return {
    rate: Math.round((completed / total) * 100),
    missing,
  }
}

/**
 * Loads the active student mentee's full record from browser localStorage demoStore.
 */
export async function getMenteeFullData(): Promise<MenteeFullData> {
  const store = getStore()
  const currentUser = getCurrentUser()

  // Find or default to demo student
  let profile = store.profiles.find(
    (p) =>
      p.id === currentUser?.id ||
      p.email === currentUser?.email ||
      p.email === 'student@demo.com'
  )

  if (!profile) {
    profile = store.profiles.find((p) => p.role === 'mentee') || store.profiles[0]
  }

  // Find or initialize student profile
  let studentProfile = store.studentProfiles.find((sp) => sp.profile_id === profile!.id)

  if (!studentProfile) {
    studentProfile = {
      id: `sp-${profile.id}`,
      profile_id: profile.id,
      usn: '4NM21IS042',
      department: profile.department || 'Information Science & Engineering',
      semester: 6,
      academic_batch: '2021-2025',
      section: 'A',
      phone: profile.phone_number || '+91 98450 12345',
      blood_group: 'O+',
      address: 'Nitte, Karkala Taluk, Udupi District, Karnataka 574110',
      parent_name: 'B. Suresh Shet',
      parent_phone: '+91 98450 99887',
      verification_status: 'submitted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: profile,
    }
    store.studentProfiles.push(studentProfile)
    saveStore(store)
  } else {
    studentProfile.profiles = profile
  }

  // Find mentor assignment
  const assignment = store.mentorAssignments.find(
    (a) => a.student_profile_id === studentProfile!.id && a.is_active
  )

  let assignedMentor: Profile | null = null
  let mentorAssignmentDate: string | undefined = undefined

  if (assignment) {
    assignedMentor = store.profiles.find((p) => p.id === assignment.mentor_profile_id) || null
    mentorAssignmentDate = assignment.assigned_at
  }

  // Academic records for this student
  const academicRecords = store.academicRecords
    .filter((ar) => ar.student_profile_id === studentProfile!.id || ar.student_id === studentProfile!.id)
    .sort((a, b) => a.semester - b.semester)

  // Mentor notes visible to mentee
  const mentorNotes = store.mentorNotes
    .filter(
      (n) =>
        (n.student_profile_id === studentProfile!.id || n.student_id === studentProfile!.id) &&
        n.visibility === 'shared_with_mentee'
    )
    .sort((a, b) => new Date(b.note_date).getTime() - new Date(a.note_date).getTime())

  // Recommendations for this student
  const recommendations = store.recommendations
    .filter((r) => r.student_profile_id === studentProfile!.id || r.student_id === studentProfile!.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Notifications for student
  const notifications = store.notifications
    .filter((n) => n.recipient_profile_id === profile!.id)
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())

  const { rate, missing } = calculateProfileCompletion(profile, studentProfile)

  return {
    profile,
    studentProfile,
    assignedMentor,
    mentorAssignmentDate,
    academicRecords,
    mentorNotes,
    recommendations,
    notifications,
    completionRate: rate,
    missingFields: missing,
  }
}

/**
 * Updates mentee demographic and contact details in localStorage
 */
export async function updateMenteeProfile(params: {
  profileId: string
  studentProfileId: string
  fullName: string
  phoneNumber?: string
  usn?: string
  semester: number
  bloodGroup?: string
  address?: string
  parentName?: string
  parentPhone?: string
  currentStatus: VerificationStatus
}) {
  const store = getStore()

  if (params.currentStatus === 'submitted') {
    throw new Error('Your profile is currently under official review and cannot be modified until reviewed.')
  }
  if (params.currentStatus === 'approved') {
    throw new Error('Verified student profiles are locked. Please contact the department HOD to request corrections.')
  }

  // 1. Update profiles table
  const profileIndex = store.profiles.findIndex((p) => p.id === params.profileId)
  if (profileIndex >= 0) {
    store.profiles[profileIndex] = {
      ...store.profiles[profileIndex],
      full_name: params.fullName.trim(),
      phone_number: params.phoneNumber?.trim() || undefined,
      updated_at: new Date().toISOString(),
    }
  }

  // 2. Update student_profiles table
  const spIndex = store.studentProfiles.findIndex((sp) => sp.id === params.studentProfileId)
  if (spIndex >= 0) {
    const existing = store.studentProfiles[spIndex]
    store.studentProfiles[spIndex] = {
      ...existing,
      semester: Number(params.semester),
      blood_group: params.bloodGroup?.trim() || undefined,
      address: params.address?.trim() || undefined,
      parent_name: params.parentName?.trim() || undefined,
      parent_phone: params.parentPhone?.trim() || undefined,
      phone: params.phoneNumber?.trim() || existing.phone,
      usn:
        params.currentStatus === 'draft' && params.usn
          ? params.usn.trim().toUpperCase()
          : existing.usn,
      updated_at: new Date().toISOString(),
    }
  }

  // Update current user if matching
  if (store.currentUser?.id === params.profileId && profileIndex >= 0) {
    store.currentUser = store.profiles[profileIndex]
  }

  saveStore(store)
  return true
}

/**
 * Adds or updates an academic record in localStorage
 */
export async function saveAcademicRecord(params: {
  id?: string
  studentProfileId: string
  academicYear: string
  semester: number
  courseCode: string
  courseName: string
  credits: number
  marksObtained?: number
  maxMarks?: number
  grade?: string
  gradePoints?: number
  attendancePercentage?: number
  isBacklog?: boolean
  remarks?: string
  currentVerificationStatus: VerificationStatus
}) {
  const store = getStore()

  if (params.currentVerificationStatus === 'submitted') {
    throw new Error('Cannot add or edit academic records while your verification submission is under review.')
  }
  if (params.currentVerificationStatus === 'approved') {
    throw new Error('Academic records have been officially approved. Contact your mentor or HOD to request changes.')
  }

  if (params.id) {
    const index = store.academicRecords.findIndex((r) => r.id === params.id)
    if (index >= 0) {
      store.academicRecords[index] = {
        ...store.academicRecords[index],
        academic_year: params.academicYear.trim(),
        semester: Number(params.semester),
        course_code: params.courseCode.trim().toUpperCase(),
        course_name: params.courseName.trim(),
        credits: Number(params.credits) || 3,
        marks_obtained: params.marksObtained !== undefined ? Number(params.marksObtained) : undefined,
        max_marks: params.maxMarks ? Number(params.maxMarks) : 100,
        grade: params.grade?.trim().toUpperCase(),
        grade_points: params.gradePoints !== undefined ? Number(params.gradePoints) : undefined,
        attendance_percentage:
          params.attendancePercentage !== undefined ? Number(params.attendancePercentage) : undefined,
        is_backlog: Boolean(params.isBacklog),
        remarks: params.remarks?.trim(),
        updated_at: new Date().toISOString(),
      }
      saveStore(store)
      return store.academicRecords[index]
    }
  }

  // Create new record
  const newRecord: AcademicRecord = {
    id: `ar-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    student_profile_id: params.studentProfileId,
    student_id: params.studentProfileId,
    academic_year: params.academicYear.trim(),
    semester: Number(params.semester),
    course_code: params.courseCode.trim().toUpperCase(),
    course_name: params.courseName.trim(),
    credits: Number(params.credits) || 3,
    marks_obtained: params.marksObtained !== undefined ? Number(params.marksObtained) : undefined,
    max_marks: params.maxMarks ? Number(params.maxMarks) : 100,
    grade: params.grade?.trim().toUpperCase(),
    grade_points: params.gradePoints !== undefined ? Number(params.gradePoints) : undefined,
    attendance_percentage:
      params.attendancePercentage !== undefined ? Number(params.attendancePercentage) : undefined,
    is_backlog: Boolean(params.isBacklog),
    remarks: params.remarks?.trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  store.academicRecords.push(newRecord)
  saveStore(store)
  return newRecord
}

/**
 * Deletes an academic record from localStorage
 */
export async function deleteAcademicRecord(
  recordId: string,
  verificationStatus: VerificationStatus
) {
  const store = getStore()

  if (verificationStatus === 'submitted' || verificationStatus === 'approved') {
    throw new Error('Cannot delete records while verification is under review or already approved.')
  }

  store.academicRecords = store.academicRecords.filter((r) => r.id !== recordId)
  saveStore(store)
  return true
}

/**
 * Submits the mentee's profile and academic records for verification
 */
export async function submitVerificationForReview(studentProfileId: string) {
  const store = getStore()
  const spIndex = store.studentProfiles.findIndex((sp) => sp.id === studentProfileId)

  if (spIndex < 0) {
    throw new Error('Student profile record could not be found.')
  }

  const sp = store.studentProfiles[spIndex]

  if (sp.verification_status === 'submitted') {
    throw new Error('Your records are already submitted and pending review.')
  }
  if (sp.verification_status === 'approved') {
    throw new Error('Your records have already been approved by the department.')
  }

  // 1. Update status to 'submitted'
  store.studentProfiles[spIndex] = {
    ...sp,
    verification_status: 'submitted',
    reviewed_at: undefined,
    updated_at: new Date().toISOString(),
  }

  const studentProfile = store.studentProfiles[spIndex]
  const studentUser = store.profiles.find((p) => p.id === studentProfile.profile_id)
  const studentName = studentUser?.full_name || 'Student'

  // 2. Notification for student
  store.notifications.push({
    id: `notif-${Date.now()}-1`,
    recipient_profile_id: studentProfile.profile_id,
    title: 'Verification Request Submitted',
    message: 'Your profile and academic records have been submitted for faculty mentor review and HOD endorsement.',
    type: 'info',
    related_entity_type: 'student_profiles',
    related_entity_id: studentProfileId,
    is_read: false,
    created_at: new Date().toISOString(),
  })

  // 3. Notification for HOD
  const hodProfile = store.profiles.find(
    (p) => p.role === 'administrator' || (p.role as string) === 'hod'
  )
  if (hodProfile) {
    store.notifications.push({
      id: `notif-${Date.now()}-2`,
      recipient_profile_id: hodProfile.id,
      title: 'Profile Submitted for Endorsement',
      message: `${studentName} (${studentProfile.usn}) has submitted their profile for departmental verification.`,
      type: 'warning',
      related_entity_type: 'student_profiles',
      related_entity_id: studentProfileId,
      is_read: false,
      created_at: new Date().toISOString(),
    })
  }

  // 4. Notification for assigned mentor if exists
  const assignment = store.mentorAssignments.find(
    (a) => a.student_profile_id === studentProfileId && a.is_active
  )
  if (assignment) {
    store.notifications.push({
      id: `notif-${Date.now()}-3`,
      recipient_profile_id: assignment.mentor_profile_id,
      title: 'Mentee Profile Submitted',
      message: `Your mentee ${studentName} (${studentProfile.usn}) submitted their profile for institutional verification.`,
      type: 'info',
      related_entity_type: 'student_profiles',
      related_entity_id: studentProfileId,
      is_read: false,
      created_at: new Date().toISOString(),
    })
  }

  // 5. Audit log
  store.auditLogs.push({
    id: `aud-${Date.now()}`,
    actor_profile_id: studentProfile.profile_id,
    action: 'SUBMITTED_STUDENT_PROFILE',
    target_type: 'student_profiles',
    target_id: studentProfileId,
    metadata: { usn: studentProfile.usn, status: 'submitted' },
    created_at: new Date().toISOString(),
  })

  saveStore(store)
  return true
}

/**
 * Marks notification as read
 */
export async function markNotificationRead(notificationId: string) {
  const store = getStore()
  const notif = store.notifications.find((n) => n.id === notificationId)
  if (notif) {
    notif.is_read = true
    notif.read = true
    saveStore(store)
  }
  return true
}

/**
 * Marks all notifications as read for profile
 */
export async function markAllNotificationsRead(recipientProfileId: string) {
  const store = getStore()
  store.notifications.forEach((n) => {
    if (n.recipient_profile_id === recipientProfileId) {
      n.is_read = true
      n.read = true
    }
  })
  saveStore(store)
  return true
}
