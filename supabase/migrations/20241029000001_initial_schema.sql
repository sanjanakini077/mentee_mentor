-- ==============================================================================
-- Migration: 20241029000001_initial_schema.sql
-- Description: Core relational schema for Mentor–Mentee Management System
-- Tables: profiles, student_profiles, academic_records, mentor_assignments,
--         mentor_notes, mentor_recommendations, notifications, audit_logs
-- ==============================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Define domain ENUM types
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('mentee', 'mentor', 'administrator');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'correction_requested');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.recommendation_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.note_visibility AS ENUM ('shared_with_mentee', 'private_mentor_only', 'department_only');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM ('info', 'success', 'warning', 'danger');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ==============================================================================
-- TABLE 1: profiles
-- References auth.users, stores primary institutional identity and RBAC role.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role         public.app_role NOT NULL DEFAULT 'mentee',
  full_name    TEXT NOT NULL CHECK (length(trim(full_name)) > 0),
  email        TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  department   TEXT NOT NULL CHECK (length(trim(department)) > 0),
  phone_number TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- TABLE 2: student_profiles
-- Extended institutional student record, USN, academic placement, verification status.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  usn                 TEXT NOT NULL UNIQUE CHECK (length(trim(usn)) >= 6),
  department          TEXT NOT NULL,
  semester            INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
  academic_batch      TEXT NOT NULL CHECK (length(trim(academic_batch)) > 0), -- e.g. "2021-2025"
  section             TEXT,
  blood_group         TEXT,
  address             TEXT,
  parent_name         TEXT,
  parent_phone        TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'draft',
  reviewer_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_comment      TEXT,
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- TABLE 3: academic_records
-- Semester-wise course grades, credits, attendance percentage, backlogs.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.academic_records (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id    UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  academic_year         TEXT NOT NULL CHECK (academic_year ~ '^[0-9]{4}-[0-9]{2,4}$'), -- e.g. "2023-24"
  semester              INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
  course_code           TEXT NOT NULL CHECK (length(trim(course_code)) > 0),
  course_name           TEXT NOT NULL CHECK (length(trim(course_name)) > 0),
  credits               INT NOT NULL DEFAULT 3 CHECK (credits > 0),
  marks_obtained        NUMERIC(5,2) CHECK (marks_obtained >= 0),
  max_marks             NUMERIC(5,2) NOT NULL DEFAULT 100.00 CHECK (max_marks > 0),
  grade                 TEXT CHECK (grade IN ('O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F', 'AB')),
  grade_points          NUMERIC(4,2) CHECK (grade_points BETWEEN 0.00 AND 10.00),
  attendance_percentage NUMERIC(5,2) CHECK (attendance_percentage BETWEEN 0.00 AND 100.00),
  is_backlog            BOOLEAN NOT NULL DEFAULT FALSE,
  remarks               TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_academic_records_student_course UNIQUE (student_profile_id, semester, course_code, academic_year)
);

CREATE TRIGGER trg_academic_records_updated_at
  BEFORE UPDATE ON public.academic_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- TABLE 4: mentor_assignments
-- Many-to-one mentorship mapping. Only administrators may assign.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.mentor_assignments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id     UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  mentor_profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  notes                  TEXT
);

-- Constraint: A student can only have ONE active mentor at any given point in time
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_mentor_per_student
  ON public.mentor_assignments (student_profile_id)
  WHERE (is_active = TRUE);

-- ==============================================================================
-- TABLE 5: mentor_notes
-- Dated mentoring session logs and guidance. Visibility rules restrict mentee view.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.mentor_notes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  mentor_profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  content            TEXT NOT NULL CHECK (length(trim(content)) > 0),
  visibility         public.note_visibility NOT NULL DEFAULT 'shared_with_mentee',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_mentor_notes_updated_at
  BEFORE UPDATE ON public.mentor_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- TABLE 6: mentor_recommendations
-- Recommendations submitted by faculty mentors to HOD for review and endorsement.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.mentor_recommendations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id  UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  mentor_profile_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category            TEXT NOT NULL CHECK (category IN ('internship', 'remedial', 'scholarship', 'disciplinary', 'general', 'merit_award')),
  details             TEXT NOT NULL CHECK (length(trim(details)) > 0),
  status              public.recommendation_status NOT NULL DEFAULT 'pending',
  reviewer_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_comment      TEXT,
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_mentor_recommendations_updated_at
  BEFORE UPDATE ON public.mentor_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- TABLE 7: notifications
-- User notification channel for system, verification, and recommendation alerts.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title                TEXT NOT NULL CHECK (length(trim(title)) > 0),
  message              TEXT NOT NULL CHECK (length(trim(message)) > 0),
  type                 public.notification_type NOT NULL DEFAULT 'info',
  related_entity_type  TEXT,
  related_entity_id    UUID,
  is_read              BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 8: audit_logs
-- Immutable action register tracking sensitive and administrative operations.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action           TEXT NOT NULL CHECK (length(trim(action)) > 0),
  target_type      TEXT NOT NULL,
  target_id        UUID NOT NULL,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);

CREATE INDEX IF NOT EXISTS idx_student_profiles_profile_id ON public.student_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_usn ON public.student_profiles(usn);
CREATE INDEX IF NOT EXISTS idx_student_profiles_dept_sem ON public.student_profiles(department, semester);
CREATE INDEX IF NOT EXISTS idx_student_profiles_verification ON public.student_profiles(verification_status);

CREATE INDEX IF NOT EXISTS idx_academic_records_student_sem ON public.academic_records(student_profile_id, semester);
CREATE INDEX IF NOT EXISTS idx_academic_records_year ON public.academic_records(academic_year);

CREATE INDEX IF NOT EXISTS idx_mentor_assignments_mentor ON public.mentor_assignments(mentor_profile_id, is_active);
CREATE INDEX IF NOT EXISTS idx_mentor_assignments_student ON public.mentor_assignments(student_profile_id, is_active);

CREATE INDEX IF NOT EXISTS idx_mentor_notes_student ON public.mentor_notes(student_profile_id);
CREATE INDEX IF NOT EXISTS idx_mentor_notes_mentor ON public.mentor_notes(mentor_profile_id);
CREATE INDEX IF NOT EXISTS idx_mentor_notes_date ON public.mentor_notes(note_date DESC);

CREATE INDEX IF NOT EXISTS idx_mentor_recommendations_student ON public.mentor_recommendations(student_profile_id);
CREATE INDEX IF NOT EXISTS idx_mentor_recommendations_mentor ON public.mentor_recommendations(mentor_profile_id);
CREATE INDEX IF NOT EXISTS idx_mentor_recommendations_status ON public.mentor_recommendations(status);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_profile_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

