export type Role = 'mentee' | 'mentor' | 'administrator' | 'hod'

export interface Profile {
  id: string
  user_id: string
  role: Role
  full_name: string
  email: string
  department: string
  phone_number?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type VerificationStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'correction_requested'

export interface StudentProfile {
  id: string
  profile_id: string
  usn: string
  department?: string
  semester: number
  academic_batch?: string
  section?: string
  phone?: string
  address?: string
  parent_name?: string
  parent_phone?: string
  blood_group?: string
  verification_status: VerificationStatus
  reviewer_profile_id?: string
  reviewer_id?: string // alias
  review_comment?: string
  reviewed_at?: string
  created_at?: string
  updated_at?: string
  profiles?: Profile
}

// Backwards-compatible alias
export type Student = StudentProfile

export interface AcademicRecord {
  id: string
  student_profile_id?: string
  student_id?: string // alias
  academic_year: string
  semester: number
  course_code?: string
  course_name?: string
  credits?: number
  marks_obtained?: number
  max_marks?: number
  grade?: string
  grade_points?: number
  attendance_percentage?: number
  is_backlog?: boolean
  remarks?: string
  sgpa?: number
  cgpa?: number
  backlogs?: number
  created_at: string
  updated_at?: string
}

export interface MentorAssignment {
  id: string
  student_profile_id?: string
  student_id?: string // alias
  mentor_profile_id?: string
  mentor_id?: string // alias
  assigned_by_profile_id?: string
  assigned_at: string
  is_active: boolean
  notes?: string
  mentor?: Profile
  student?: StudentProfile & { profiles?: Profile }
}

export type NoteVisibility = 'shared_with_mentee' | 'private_mentor_only' | 'department_only'

export interface MentorNote {
  id: string
  student_profile_id?: string
  student_id?: string // alias
  mentor_profile_id?: string
  mentor_id?: string // alias
  note_date: string
  content: string
  visibility?: NoteVisibility
  created_at: string
  updated_at?: string
  student?: StudentProfile & { profiles?: Profile }
  mentor?: Profile
}

// Backwards-compatible alias
export type MentoringNote = MentorNote

export type RecommendationCategory =
  | 'internship'
  | 'remedial'
  | 'scholarship'
  | 'disciplinary'
  | 'general'
  | 'merit_award'

export type RecommendationStatus = 'pending' | 'approved' | 'rejected'

export interface MentorRecommendation {
  id: string
  student_profile_id?: string
  student_id?: string // alias
  mentor_profile_id?: string
  mentor_id?: string // alias
  category?: RecommendationCategory
  details?: string
  content?: string // alias for details
  status: RecommendationStatus
  reviewer_profile_id?: string
  reviewer_id?: string // alias
  review_comment?: string
  hod_comment?: string // alias
  reviewed_at?: string
  created_at: string
  updated_at?: string
  student?: StudentProfile & { profiles?: Profile }
  mentor?: Profile
}

// Backwards-compatible alias
export type Recommendation = MentorRecommendation

export interface VerificationRequest {
  id: string
  student_id: string
  submitted_at: string
  status: VerificationStatus
  reviewer_id?: string
  review_comment?: string
  reviewed_at?: string
}

export type NotificationType = 'info' | 'success' | 'warning' | 'danger'

export interface AppNotification {
  id: string
  recipient_profile_id?: string
  title: string
  message: string
  type?: NotificationType
  related_entity_type?: string
  related_entity_id?: string
  is_read?: boolean
  read?: boolean // alias
  created_at?: string
  timestamp?: string // alias
}

export interface AuditLog {
  id: string
  actor_profile_id?: string
  actor_id?: string // alias
  action: string
  target_type: string
  target_id: string
  metadata?: Record<string, unknown>
  created_at: string
  actor?: Profile
}

export interface BreadcrumbItem {
  label: string
  href?: string
}
