'use client'

import type {
  Profile,
  StudentProfile,
  AcademicRecord,
  MentorAssignment,
  MentorNote,
  MentorRecommendation,
  AppNotification,
  AuditLog,
  Role,
} from '@/types'

export interface DemoStoreData {
  version: number
  currentUser: Profile | null
  profiles: Profile[]
  studentProfiles: StudentProfile[]
  academicRecords: AcademicRecord[]
  mentorAssignments: MentorAssignment[]
  mentorNotes: MentorNote[]
  recommendations: MentorRecommendation[]
  notifications: AppNotification[]
  auditLogs: AuditLog[]
}

const STORAGE_KEY = 'MMS_DEMO_DATA_V1'
const CURRENT_VERSION = 1

// Initial Default Demo Data
const INITIAL_PROFILES: Profile[] = [
  {
    id: 'p-student-demo',
    user_id: 'u-student-demo',
    role: 'mentee',
    full_name: 'Gaurav B. Shet',
    email: 'student@demo.com',
    department: 'Information Science & Engineering',
    phone_number: '+91 98450 12345',
    created_at: '2024-08-01T09:00:00Z',
    updated_at: '2024-08-01T09:00:00Z',
  },
  {
    id: 'p-student-2',
    user_id: 'u-student-2',
    role: 'mentee',
    full_name: 'Priya R. Rao',
    email: 'priya.rao@nmamit.in',
    department: 'Information Science & Engineering',
    phone_number: '+91 98451 23456',
    created_at: '2024-08-02T09:00:00Z',
    updated_at: '2024-08-02T09:00:00Z',
  },
  {
    id: 'p-student-3',
    user_id: 'u-student-3',
    role: 'mentee',
    full_name: 'Kavya Nayak',
    email: 'kavya.n@nmamit.in',
    department: 'Information Science & Engineering',
    phone_number: '+91 98452 34567',
    created_at: '2024-08-03T09:00:00Z',
    updated_at: '2024-08-03T09:00:00Z',
  },
  {
    id: 'p-student-4',
    user_id: 'u-student-4',
    role: 'mentee',
    full_name: 'Aditya K.',
    email: 'aditya.k@nmamit.in',
    department: 'Information Science & Engineering',
    phone_number: '+91 98453 45678',
    created_at: '2024-08-04T09:00:00Z',
    updated_at: '2024-08-04T09:00:00Z',
  },
  {
    id: 'p-mentor-demo',
    user_id: 'u-mentor-demo',
    role: 'mentor',
    full_name: 'Dr. K. S. Venkatesh',
    email: 'mentor@demo.com',
    department: 'Information Science & Engineering',
    phone_number: '+91 98450 11223',
    created_at: '2023-01-10T09:00:00Z',
    updated_at: '2023-01-10T09:00:00Z',
  },
  {
    id: 'p-mentor-2',
    user_id: 'u-mentor-2',
    role: 'mentor',
    full_name: 'Prof. Deepa Kamath',
    email: 'deepa.kamath@nmamit.in',
    department: 'Information Science & Engineering',
    phone_number: '+91 98459 88776',
    created_at: '2023-03-12T09:00:00Z',
    updated_at: '2023-03-12T09:00:00Z',
  },
  {
    id: 'p-hod-demo',
    user_id: 'u-hod-demo',
    role: 'administrator',
    full_name: 'Dr. Balasubramani R (HOD ISE)',
    email: 'hod@demo.com',
    department: 'Information Science & Engineering',
    phone_number: '+91 98765 43210',
    created_at: '2022-06-15T09:00:00Z',
    updated_at: '2022-06-15T09:00:00Z',
  },
]

const INITIAL_STUDENT_PROFILES: StudentProfile[] = [
  {
    id: 'sp-student-demo',
    profile_id: 'p-student-demo',
    usn: '4NM21IS042',
    department: 'Information Science & Engineering',
    semester: 6,
    academic_batch: '2021-2025',
    section: 'A',
    phone: '+91 98450 12345',
    blood_group: 'O+',
    address: 'Nitte, Karkala Taluk, Udupi District, Karnataka 574110',
    parent_name: 'B. Suresh Shet',
    parent_phone: '+91 98450 99887',
    verification_status: 'submitted',
    reviewer_profile_id: 'p-hod-demo',
    review_comment: 'Demographic and academic details submitted for HOD departmental endorsement.',
    reviewed_at: '2024-10-15T11:30:00Z',
    created_at: '2024-08-01T09:00:00Z',
    updated_at: '2024-10-15T11:30:00Z',
  },
  {
    id: 'sp-student-2',
    profile_id: 'p-student-2',
    usn: '4NM21IS078',
    department: 'Information Science & Engineering',
    semester: 6,
    academic_batch: '2021-2025',
    section: 'B',
    phone: '+91 98451 23456',
    blood_group: 'B+',
    address: 'Main Street, Karkala, Udupi District, Karnataka 574104',
    parent_name: 'Ramesh Rao',
    parent_phone: '+91 98450 44332',
    verification_status: 'approved',
    reviewer_profile_id: 'p-hod-demo',
    review_comment: 'Student profile verified and officially endorsed by HOD.',
    reviewed_at: '2024-09-10T10:00:00Z',
    created_at: '2024-08-02T09:00:00Z',
    updated_at: '2024-09-10T10:00:00Z',
  },
  {
    id: 'sp-student-3',
    profile_id: 'p-student-3',
    usn: '4NM22IS015',
    department: 'Information Science & Engineering',
    semester: 4,
    academic_batch: '2022-2026',
    section: 'A',
    phone: '+91 98452 34567',
    blood_group: 'A+',
    address: 'Brahmagiri, Udupi, Karnataka 576101',
    parent_name: 'Prabhakar Nayak',
    parent_phone: '+91 98450 66778',
    verification_status: 'correction_requested',
    reviewer_profile_id: 'p-hod-demo',
    review_comment: 'Please update parent contact number and verify blood group certificate.',
    reviewed_at: '2024-10-18T14:20:00Z',
    created_at: '2024-08-03T09:00:00Z',
    updated_at: '2024-10-18T14:20:00Z',
  },
  {
    id: 'sp-student-4',
    profile_id: 'p-student-4',
    usn: '4NM23IS009',
    department: 'Information Science & Engineering',
    semester: 2,
    academic_batch: '2023-2027',
    section: 'C',
    phone: '+91 98453 45678',
    blood_group: 'AB+',
    address: 'Kadri, Mangaluru, Karnataka 575002',
    parent_name: 'Krishna K.',
    parent_phone: '+91 98450 11990',
    verification_status: 'draft',
    created_at: '2024-08-04T09:00:00Z',
    updated_at: '2024-08-04T09:00:00Z',
  },
]

const INITIAL_ACADEMIC_RECORDS: AcademicRecord[] = [
  {
    id: 'ar-1',
    student_profile_id: 'sp-student-demo',
    semester: 1,
    academic_year: '2021-22',
    course_code: '21MAT11',
    course_name: 'Calculus and Linear Algebra',
    credits: 4,
    marks_obtained: 92,
    max_marks: 100,
    grade: 'A+',
    grade_points: 9.0,
    attendance_percentage: 95.5,
    is_backlog: false,
    sgpa: 8.85,
    cgpa: 8.85,
    backlogs: 0,
    remarks: 'Consistent top quadrant academic performance.',
    created_at: '2022-02-15T10:00:00Z',
  },
  {
    id: 'ar-2',
    student_profile_id: 'sp-student-demo',
    semester: 2,
    academic_year: '2021-22',
    course_code: '21CHE22',
    course_name: 'Engineering Chemistry',
    credits: 4,
    marks_obtained: 95,
    max_marks: 100,
    grade: 'O',
    grade_points: 10.0,
    attendance_percentage: 98.0,
    is_backlog: false,
    sgpa: 9.15,
    cgpa: 9.0,
    backlogs: 0,
    remarks: 'Excellent in core laboratories and theory.',
    created_at: '2022-07-20T10:00:00Z',
  },
  {
    id: 'ar-3',
    student_profile_id: 'sp-student-demo',
    semester: 3,
    academic_year: '2022-23',
    course_code: '21CS31',
    course_name: 'Data Structures and Applications',
    credits: 4,
    marks_obtained: 88,
    max_marks: 100,
    grade: 'A+',
    grade_points: 9.0,
    attendance_percentage: 92.0,
    is_backlog: false,
    sgpa: 8.75,
    cgpa: 8.92,
    backlogs: 0,
    remarks: 'Solid grasp of algorithmic concepts.',
    created_at: '2023-02-10T10:00:00Z',
  },
  {
    id: 'ar-4',
    student_profile_id: 'sp-student-demo',
    semester: 4,
    academic_year: '2022-23',
    course_code: '21CS41',
    course_name: 'Design and Analysis of Algorithms',
    credits: 4,
    marks_obtained: 96,
    max_marks: 100,
    grade: 'O',
    grade_points: 10.0,
    attendance_percentage: 96.0,
    is_backlog: false,
    sgpa: 9.25,
    cgpa: 9.0,
    backlogs: 0,
    remarks: 'Distinction level work in laboratory projects.',
    created_at: '2023-07-15T10:00:00Z',
  },
  {
    id: 'ar-5',
    student_profile_id: 'sp-student-demo',
    semester: 5,
    academic_year: '2023-24',
    course_code: '21IS51',
    course_name: 'Database Management Systems',
    credits: 4,
    marks_obtained: 94,
    max_marks: 100,
    grade: 'O',
    grade_points: 10.0,
    attendance_percentage: 94.0,
    is_backlog: false,
    sgpa: 9.1,
    cgpa: 9.02,
    backlogs: 0,
    remarks: 'Active mentor engagement and strong course performance.',
    created_at: '2024-02-18T10:00:00Z',
  },
  {
    id: 'ar-6',
    student_profile_id: 'sp-student-2',
    semester: 5,
    academic_year: '2023-24',
    course_code: '21IS51',
    course_name: 'Database Management Systems',
    credits: 4,
    marks_obtained: 85,
    max_marks: 100,
    grade: 'A',
    grade_points: 8.5,
    attendance_percentage: 91.0,
    is_backlog: false,
    sgpa: 8.6,
    cgpa: 8.55,
    backlogs: 0,
    remarks: 'Clear pass with commendable discipline.',
    created_at: '2024-02-18T10:00:00Z',
  },
]

const INITIAL_ASSIGNMENTS: MentorAssignment[] = [
  {
    id: 'asg-1',
    student_profile_id: 'sp-student-demo',
    mentor_profile_id: 'p-mentor-demo',
    assigned_by_profile_id: 'p-hod-demo',
    assigned_at: '2023-08-15T10:00:00Z',
    is_active: true,
    notes: 'Assigned by HOD ISE for 2021-2025 batch mentorship.',
  },
  {
    id: 'asg-2',
    student_profile_id: 'sp-student-2',
    mentor_profile_id: 'p-mentor-demo',
    assigned_by_profile_id: 'p-hod-demo',
    assigned_at: '2023-08-15T10:00:00Z',
    is_active: true,
    notes: 'Assigned for ongoing academic guidance.',
  },
  {
    id: 'asg-3',
    student_profile_id: 'sp-student-3',
    mentor_profile_id: 'p-mentor-2',
    assigned_by_profile_id: 'p-hod-demo',
    assigned_at: '2023-08-15T10:00:00Z',
    is_active: true,
    notes: 'Assigned to Prof. Deepa Kamath.',
  },
]

const INITIAL_NOTES: MentorNote[] = [
  {
    id: 'note-1',
    student_profile_id: 'sp-student-demo',
    mentor_profile_id: 'p-mentor-demo',
    note_date: '2024-10-10',
    content:
      'Discussed final-year project domains and professional certifications. Advised student to look into Cloud Architecture and Distributed Data Systems.',
    visibility: 'shared_with_mentee',
    created_at: '2024-10-10T14:00:00Z',
    updated_at: '2024-10-10T14:00:00Z',
  },
  {
    id: 'note-2',
    student_profile_id: 'sp-student-demo',
    mentor_profile_id: 'p-mentor-demo',
    note_date: '2024-09-05',
    content:
      'Reviewed midterm test results. Commended student for strong attendance (>95%) and active classroom participation.',
    visibility: 'shared_with_mentee',
    created_at: '2024-09-05T11:00:00Z',
    updated_at: '2024-09-05T11:00:00Z',
  },
  {
    id: 'note-3',
    student_profile_id: 'sp-student-demo',
    mentor_profile_id: 'p-mentor-demo',
    note_date: '2024-08-20',
    content:
      'Faculty confidential record: Student has demonstrated high technical aptitude. Recommended for student coordinator position at Departmental Symposium.',
    visibility: 'private_mentor_only',
    created_at: '2024-08-20T16:00:00Z',
    updated_at: '2024-08-20T16:00:00Z',
  },
  {
    id: 'note-4',
    student_profile_id: 'sp-student-2',
    mentor_profile_id: 'p-mentor-demo',
    note_date: '2024-10-02',
    content:
      'Provided career mentoring regarding Infosys Springboard and competitive programming tracks.',
    visibility: 'shared_with_mentee',
    created_at: '2024-10-02T15:00:00Z',
    updated_at: '2024-10-02T15:00:00Z',
  },
]

const INITIAL_RECOMMENDATIONS: MentorRecommendation[] = [
  {
    id: 'rec-1',
    student_profile_id: 'sp-student-demo',
    mentor_profile_id: 'p-mentor-demo',
    category: 'internship',
    details:
      'Strongly recommended for Summer Research Internship at IISc Bangalore in Distributed Systems & Scalable Systems laboratory based on stellar CGPA (9.02).',
    status: 'pending',
    created_at: '2024-10-22T10:00:00Z',
    updated_at: '2024-10-22T10:00:00Z',
  },
  {
    id: 'rec-2',
    student_profile_id: 'sp-student-2',
    mentor_profile_id: 'p-mentor-demo',
    category: 'merit_award',
    details:
      'Nominated for Departmental Best Academic Performer Semester 5 merit award.',
    status: 'approved',
    reviewer_profile_id: 'p-hod-demo',
    review_comment: 'Approved. Merit certificate sanctioned by Department HOD.',
    reviewed_at: '2024-10-25T12:00:00Z',
    created_at: '2024-10-18T09:00:00Z',
    updated_at: '2024-10-25T12:00:00Z',
  },
  {
    id: 'rec-3',
    student_profile_id: 'sp-student-3',
    mentor_profile_id: 'p-mentor-2',
    category: 'remedial',
    details:
      'Advised 3 weeks of intensive peer tutoring and remedial lab sessions for course 21CS32.',
    status: 'pending',
    created_at: '2024-10-26T14:00:00Z',
    updated_at: '2024-10-26T14:00:00Z',
  },
]

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    recipient_profile_id: 'p-student-demo',
    title: 'Mentoring Note Added',
    message: 'Dr. K. S. Venkatesh added a new mentoring note on Final Year Project Guidance.',
    type: 'info',
    related_entity_type: 'mentor_notes',
    related_entity_id: 'note-1',
    is_read: false,
    created_at: '2024-10-10T14:05:00Z',
  },
  {
    id: 'notif-2',
    recipient_profile_id: 'p-student-demo',
    title: 'Verification Status Submitted',
    message: 'Your profile has been submitted and is currently under review by Department HOD.',
    type: 'info',
    related_entity_type: 'student_profiles',
    related_entity_id: 'sp-student-demo',
    is_read: true,
    created_at: '2024-10-15T11:35:00Z',
  },
  {
    id: 'notif-3',
    recipient_profile_id: 'p-mentor-demo',
    title: 'New Student Profile Submitted',
    message: 'Gaurav B. Shet submitted their profile for institutional verification.',
    type: 'info',
    related_entity_type: 'student_profiles',
    related_entity_id: 'sp-student-demo',
    is_read: false,
    created_at: '2024-10-15T11:36:00Z',
  },
  {
    id: 'notif-4',
    recipient_profile_id: 'p-hod-demo',
    title: 'Pending Mentor Recommendation',
    message: 'Dr. K. S. Venkatesh submitted an Internship Recommendation for Gaurav B. Shet.',
    type: 'warning',
    related_entity_type: 'mentor_recommendations',
    related_entity_id: 'rec-1',
    is_read: false,
    created_at: '2024-10-22T10:05:00Z',
  },
  {
    id: 'notif-5',
    recipient_profile_id: 'p-hod-demo',
    title: 'Student Profile Awaiting Endorsement',
    message: '1 student profile (Gaurav B. Shet) is pending review in the Department Workspace.',
    type: 'info',
    related_entity_type: 'student_profiles',
    related_entity_id: 'sp-student-demo',
    is_read: false,
    created_at: '2024-10-15T11:30:00Z',
  },
]

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    actor_profile_id: 'p-student-demo',
    action: 'SUBMITTED_STUDENT_PROFILE',
    target_type: 'student_profiles',
    target_id: 'sp-student-demo',
    metadata: { usn: '4NM21IS042', status: 'submitted' },
    created_at: '2024-10-15T11:30:00Z',
  },
  {
    id: 'aud-2',
    actor_profile_id: 'p-mentor-demo',
    action: 'CREATED_MENTOR_NOTE',
    target_type: 'mentor_notes',
    target_id: 'note-1',
    metadata: { student_profile_id: 'sp-student-demo', visibility: 'shared_with_mentee' },
    created_at: '2024-10-10T14:00:00Z',
  },
  {
    id: 'aud-3',
    actor_profile_id: 'p-mentor-demo',
    action: 'SUBMITTED_RECOMMENDATION',
    target_type: 'mentor_recommendations',
    target_id: 'rec-1',
    metadata: { category: 'internship', student_profile_id: 'sp-student-demo' },
    created_at: '2024-10-22T10:00:00Z',
  },
  {
    id: 'aud-4',
    actor_profile_id: 'p-hod-demo',
    action: 'APPROVED_RECOMMENDATION',
    target_type: 'mentor_recommendations',
    target_id: 'rec-2',
    metadata: { status: 'approved', comment: 'Approved. Merit certificate sanctioned.' },
    created_at: '2024-10-25T12:00:00Z',
  },
]

function getInitialStore(): DemoStoreData {
  return {
    version: CURRENT_VERSION,
    currentUser: INITIAL_PROFILES[0], // default: student
    profiles: INITIAL_PROFILES,
    studentProfiles: INITIAL_STUDENT_PROFILES,
    academicRecords: INITIAL_ACADEMIC_RECORDS,
    mentorAssignments: INITIAL_ASSIGNMENTS,
    mentorNotes: INITIAL_NOTES,
    recommendations: INITIAL_RECOMMENDATIONS,
    notifications: INITIAL_NOTIFICATIONS,
    auditLogs: INITIAL_AUDIT_LOGS,
  }
}

/**
 * Safely loads the demo data store from localStorage in the browser.
 */
export function getStore(): DemoStoreData {
  if (typeof window === 'undefined') {
    return getInitialStore()
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = getInitialStore()
      saveStore(initial)
      return initial
    }

    const parsed = JSON.parse(raw) as DemoStoreData
    if (!parsed || parsed.version !== CURRENT_VERSION) {
      const reset = getInitialStore()
      saveStore(reset)
      return reset
    }

    return parsed
  } catch (err) {
    console.warn('Failed to parse localStorage demo data, re-initializing.', err)
    const fallback = getInitialStore()
    saveStore(fallback)
    return fallback
  }
}

/**
 * Saves store to localStorage and broadcasts change event.
 */
export function saveStore(data: DemoStoreData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('mms-store-changed', { detail: data }))
  } catch (err) {
    console.error('Failed to save to localStorage:', err)
  }
}

/**
 * Resets store back to fresh initial demo seed.
 */
export function resetDemoData(): DemoStoreData {
  const fresh = getInitialStore()
  // Keep the role/currentUser that was currently logged in, mapped to fresh profile
  if (typeof window !== 'undefined') {
    try {
      const current = getCurrentUser()
      if (current) {
        const matchingFresh = fresh.profiles.find((p) => p.email === current.email)
        if (matchingFresh) {
          fresh.currentUser = matchingFresh
        }
      }
    } catch {
      // ignore
    }
  }
  saveStore(fresh)
  return fresh
}

/**
 * Returns currently authenticated simulated user.
 */
export function getCurrentUser(): Profile | null {
  if (typeof window === 'undefined') return INITIAL_PROFILES[0]
  const store = getStore()
  return store.currentUser
}

/**
 * Sets active user session.
 */
export function setCurrentUser(user: Profile | null): void {
  const store = getStore()
  store.currentUser = user
  saveStore(store)
}

/**
 * Authenticates one of the 3 demo accounts.
 */
export function loginDemoUser(emailOrRole: string): Profile {
  const store = getStore()
  const lower = emailOrRole.toLowerCase().trim()

  let user: Profile | undefined

  if (lower === 'student' || lower === 'student@demo.com') {
    user = store.profiles.find((p) => p.email === 'student@demo.com')
  } else if (lower === 'mentor' || lower === 'faculty' || lower === 'mentor@demo.com') {
    user = store.profiles.find((p) => p.email === 'mentor@demo.com')
  } else if (
    lower === 'hod' ||
    lower === 'admin' ||
    lower === 'administrator' ||
    lower === 'hod@demo.com' ||
    lower === 'hod.ise@nmamit.in'
  ) {
    user = store.profiles.find((p) => p.email === 'hod@demo.com')
  } else {
    user = store.profiles.find((p) => p.email.toLowerCase() === lower)
  }

  if (!user) {
    // Fallback: match by role
    if (lower.includes('mentor')) {
      user = store.profiles.find((p) => p.role === 'mentor')
    } else if (lower.includes('hod') || lower.includes('admin')) {
      user = store.profiles.find((p) => p.role === 'administrator' || (p.role as string) === 'hod')
    } else {
      user = store.profiles.find((p) => p.role === 'mentee')
    }
  }

  const finalUser = user || store.profiles[0]
  setCurrentUser(finalUser)
  return finalUser
}

/**
 * Logs out active user.
 */
export function logoutDemoUser(): void {
  setCurrentUser(null)
}

