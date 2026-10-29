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
-- ==============================================================================
-- Migration: 20241029000002_helper_functions_and_triggers.sql
-- Description: Security Definer Helper Functions & Data Integrity Triggers
-- ==============================================================================

-- ==============================================================================
-- 1. SECURITY DEFINER HELPER FUNCTIONS (Avoids Recursive RLS Policies)
-- ==============================================================================

-- Returns the profile ID of the currently authenticated auth.uid()
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Returns the institutional role of the currently authenticated auth.uid()
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Returns the department of the currently authenticated auth.uid()
CREATE OR REPLACE FUNCTION public.current_department()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Checks if the authenticated user is an active mentor to a given student profile
CREATE OR REPLACE FUNCTION public.is_assigned_mentor(p_student_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.mentor_assignments ma
    WHERE ma.mentor_profile_id = public.current_profile_id()
      AND ma.student_profile_id = p_student_profile_id
      AND ma.is_active = TRUE
  );
$$;

-- Checks if the authenticated user owns a given student profile
CREATE OR REPLACE FUNCTION public.is_assigned_mentee(p_student_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_profiles sp
    WHERE sp.id = p_student_profile_id
      AND sp.profile_id = public.current_profile_id()
  );
$$;

-- Retrieves the department of a student profile
CREATE OR REPLACE FUNCTION public.get_student_department(p_student_profile_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department FROM public.student_profiles WHERE id = p_student_profile_id LIMIT 1;
$$;

-- ==============================================================================
-- 2. FIELD INTEGRITY & ROLE ESCALATION PREVENTION TRIGGERS
-- ==============================================================================

-- Prevent unauthorized role changes or user_id tampering on `profiles`
CREATE OR REPLACE FUNCTION public.prevent_profile_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role public.app_role;
BEGIN
  -- Prevent user_id from being reassigned
  IF NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'Ownership tampering detected: profile user_id cannot be modified.';
  END IF;

  -- If role is changing, ensure caller is an administrator or database superuser/service_role
  IF NEW.role <> OLD.role THEN
    IF current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
      v_caller_role := public.current_role();
      IF v_caller_role IS NULL OR v_caller_role <> 'administrator' THEN
        RAISE EXCEPTION 'Privilege escalation rejected: only administrators can alter role assignments.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_profile_tampering
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_tampering();

-- Prevent mentees from approving their own profile or tampering with review fields
CREATE OR REPLACE FUNCTION public.prevent_student_verification_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role public.app_role;
BEGIN
  v_caller_role := public.current_role();

  -- If caller is a mentee
  IF v_caller_role = 'mentee' THEN
    -- Mentees can never set status to approved or rejected directly
    IF NEW.verification_status IN ('approved', 'rejected') AND OLD.verification_status <> NEW.verification_status THEN
      RAISE EXCEPTION 'Unauthorized decision: students cannot approve or reject their own verification.';
    END IF;

    -- Mentees cannot modify reviewer metadata
    IF NEW.reviewer_profile_id IS DISTINCT FROM OLD.reviewer_profile_id OR
       NEW.review_comment IS DISTINCT FROM OLD.review_comment OR
       NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
      RAISE EXCEPTION 'Unauthorized edit: students cannot modify reviewer feedback or decision metadata.';
    END IF;
  END IF;

  -- When administrator reviews, ensure reviewed_at and reviewer_profile_id are tracked
  IF NEW.verification_status IN ('approved', 'rejected', 'correction_requested') AND
     OLD.verification_status <> NEW.verification_status AND
     v_caller_role = 'administrator' THEN
    NEW.reviewer_profile_id := public.current_profile_id();
    NEW.reviewed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_student_verification_tampering
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_student_verification_tampering();

-- Prevent mentors from approving their own recommendations
CREATE OR REPLACE FUNCTION public.prevent_recommendation_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role public.app_role;
BEGIN
  v_caller_role := public.current_role();

  -- If mentor tries to alter review status or review comment
  IF v_caller_role = 'mentor' THEN
    IF NEW.status <> OLD.status THEN
      RAISE EXCEPTION 'Unauthorized decision: mentors cannot approve or decide on their own recommendations.';
    END IF;

    IF NEW.reviewer_profile_id IS DISTINCT FROM OLD.reviewer_profile_id OR
       NEW.review_comment IS DISTINCT FROM OLD.review_comment OR
       NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
      RAISE EXCEPTION 'Unauthorized edit: mentors cannot modify HOD review comments or reviewer timestamps.';
    END IF;
  END IF;

  -- When administrator reviews, automatically set reviewer and reviewed_at
  IF NEW.status IN ('approved', 'rejected') AND
     OLD.status <> NEW.status AND
     v_caller_role = 'administrator' THEN
    NEW.reviewer_profile_id := public.current_profile_id();
    NEW.reviewed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_recommendation_tampering
  BEFORE UPDATE ON public.mentor_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_recommendation_tampering();

-- Enforce strict immutability on audit_logs (append-only)
CREATE OR REPLACE FUNCTION public.enforce_audit_log_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit log violation: audit records are immutable and cannot be updated or deleted.';
END;
$$;

CREATE TRIGGER trg_audit_logs_no_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_audit_log_immutability();

CREATE TRIGGER trg_audit_logs_no_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_audit_log_immutability();

-- ==============================================================================
-- 3. AUTOMATIC PROFILE INITIALIZATION ON AUTH.USERS INSERT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_role public.app_role;
  v_full_name TEXT;
  v_department TEXT;
  v_profile_id UUID;
  v_raw_role TEXT;
BEGIN
  -- Strict institutional security:
  -- Self-registration defaults strictly to 'mentee'.
  -- Privileged roles ('administrator' or 'mentor') can NEVER be claimed via client metadata during self-signup.
  -- Only when created via service_role/admin provisioning or DB superuser can elevated roles be assigned initially.
  IF current_user IN ('postgres', 'supabase_admin', 'service_role', 'supabase_auth_admin') THEN
    v_raw_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'mentee'));
    IF v_raw_role IN ('mentor', 'faculty') THEN
      v_role := 'mentor';
    ELSIF v_raw_role IN ('administrator', 'hod', 'admin') THEN
      v_role := 'administrator';
    ELSE
      v_role := 'mentee';
    END IF;
  ELSE
    -- Any public signup through anon key is unconditionally a mentee
    v_role := 'mentee';
  END IF;

  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1));
  v_department := COALESCE(NEW.raw_user_meta_data->>'department', 'Information Science & Engineering');

  INSERT INTO public.profiles (user_id, role, full_name, email, department, phone_number)
  VALUES (
    NEW.id,
    v_role,
    v_full_name,
    NEW.email,
    v_department,
    NEW.raw_user_meta_data->>'phone_number'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email
  RETURNING id INTO v_profile_id;

  -- If registered as a mentee, automatically scaffold a blank student_profiles entry if USN is provided
  IF v_role = 'mentee' AND NEW.raw_user_meta_data->>'usn' IS NOT NULL THEN
    INSERT INTO public.student_profiles (
      profile_id,
      usn,
      department,
      semester,
      academic_batch
    )
    VALUES (
      v_profile_id,
      UPPER(TRIM(NEW.raw_user_meta_data->>'usn')),
      v_department,
      COALESCE((NEW.raw_user_meta_data->>'semester')::INT, 1),
      COALESCE(NEW.raw_user_meta_data->>'academic_batch', '2024-2028')
    )
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Safe fallback: log warning and never abort auth.users transaction
  RAISE WARNING 'handle_new_auth_user error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Trigger attached to auth.users (runs automatically in Supabase)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
-- ==============================================================================
-- Migration: 20241029000003_row_level_security.sql
-- Description: Explicit Granular Row Level Security (RLS) Policies
-- Covers: profiles, student_profiles, academic_records, mentor_assignments,
--         mentor_notes, mentor_recommendations, notifications, audit_logs
-- ==============================================================================

-- 1. Enable RLS on every application table
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs            ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLICIES: profiles
-- ==============================================================================

-- SELECT: Users read own profile; mentors read assigned students; admins read department; mentees read assigned mentor
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "profiles_select_admin_dept"
  ON public.profiles FOR SELECT
  USING (
    public.current_role() = 'administrator'
    AND department = public.current_department()
  );

CREATE POLICY "profiles_select_mentor_assigned_students"
  ON public.profiles FOR SELECT
  USING (
    public.current_role() = 'mentor'
    AND id IN (
      SELECT sp.profile_id
      FROM public.student_profiles sp
      JOIN public.mentor_assignments ma ON ma.student_profile_id = sp.id
      WHERE ma.mentor_profile_id = public.current_profile_id()
        AND ma.is_active = TRUE
    )
  );

CREATE POLICY "profiles_select_mentee_assigned_mentor"
  ON public.profiles FOR SELECT
  USING (
    public.current_role() = 'mentee'
    AND id IN (
      SELECT ma.mentor_profile_id
      FROM public.mentor_assignments ma
      JOIN public.student_profiles sp ON sp.id = ma.student_profile_id
      WHERE sp.profile_id = public.current_profile_id()
        AND ma.is_active = TRUE
    )
  );

-- INSERT: Authenticated user creates their own profile record upon sign-up
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users update own profile or admins update within department
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_admin_dept"
  ON public.profiles FOR UPDATE
  USING (
    public.current_role() = 'administrator'
    AND department = public.current_department()
  );

-- DELETE: Administrators only
CREATE POLICY "profiles_delete_admin_dept"
  ON public.profiles FOR DELETE
  USING (
    public.current_role() = 'administrator'
    AND department = public.current_department()
  );

-- ==============================================================================
-- POLICIES: student_profiles
-- ==============================================================================

-- SELECT: Mentees read own; mentors read assigned; admins read department
CREATE POLICY "student_profiles_select_mentee_own"
  ON public.student_profiles FOR SELECT
  USING (profile_id = public.current_profile_id());

CREATE POLICY "student_profiles_select_mentor_assigned"
  ON public.student_profiles FOR SELECT
  USING (
    public.current_role() = 'mentor'
    AND public.is_assigned_mentor(id) = TRUE
  );

CREATE POLICY "student_profiles_select_admin_dept"
  ON public.student_profiles FOR SELECT
  USING (
    public.current_role() = 'administrator'
    AND department = public.current_department()
  );

-- INSERT: Mentee creates own student record or admin creates within department
CREATE POLICY "student_profiles_insert_mentee_own"
  ON public.student_profiles FOR INSERT
  WITH CHECK (
    profile_id = public.current_profile_id()
    AND public.current_role() = 'mentee'
  );

CREATE POLICY "student_profiles_insert_admin_dept"
  ON public.student_profiles FOR INSERT
  WITH CHECK (
    public.current_role() = 'administrator'
    AND department = public.current_department()
  );

-- UPDATE: Mentee updates own demographic details; admin updates verification status and review feedback
CREATE POLICY "student_profiles_update_mentee_own"
  ON public.student_profiles FOR UPDATE
  USING (
    profile_id = public.current_profile_id()
    AND public.current_role() = 'mentee'
  )
  WITH CHECK (
    profile_id = public.current_profile_id()
    AND public.current_role() = 'mentee'
  );

CREATE POLICY "student_profiles_update_admin_dept"
  ON public.student_profiles FOR UPDATE
  USING (
    public.current_role() = 'administrator'
    AND department = public.current_department()
  );

-- DELETE: Administrator only
CREATE POLICY "student_profiles_delete_admin_dept"
  ON public.student_profiles FOR DELETE
  USING (
    public.current_role() = 'administrator'
    AND department = public.current_department()
  );

-- ==============================================================================
-- POLICIES: academic_records
-- ==============================================================================

CREATE POLICY "academic_records_select_mentee_own"
  ON public.academic_records FOR SELECT
  USING (public.is_assigned_mentee(student_profile_id) = TRUE);

CREATE POLICY "academic_records_select_mentor_assigned"
  ON public.academic_records FOR SELECT
  USING (
    public.current_role() = 'mentor'
    AND public.is_assigned_mentor(student_profile_id) = TRUE
  );

CREATE POLICY "academic_records_select_admin_dept"
  ON public.academic_records FOR SELECT
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

CREATE POLICY "academic_records_insert_mentee_own"
  ON public.academic_records FOR INSERT
  WITH CHECK (
    public.is_assigned_mentee(student_profile_id) = TRUE
    AND public.current_role() = 'mentee'
  );

CREATE POLICY "academic_records_insert_admin_dept"
  ON public.academic_records FOR INSERT
  WITH CHECK (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

CREATE POLICY "academic_records_update_mentee_own"
  ON public.academic_records FOR UPDATE
  USING (
    public.is_assigned_mentee(student_profile_id) = TRUE
    AND public.current_role() = 'mentee'
  );

CREATE POLICY "academic_records_update_admin_dept"
  ON public.academic_records FOR UPDATE
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

CREATE POLICY "academic_records_delete_mentee_own"
  ON public.academic_records FOR DELETE
  USING (
    public.is_assigned_mentee(student_profile_id) = TRUE
    AND public.current_role() = 'mentee'
  );

CREATE POLICY "academic_records_delete_admin_dept"
  ON public.academic_records FOR DELETE
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

-- ==============================================================================
-- POLICIES: mentor_assignments
-- ==============================================================================

-- SELECT: Mentors see own assignments; mentees see assigned mentor; admins see department
CREATE POLICY "mentor_assignments_select_mentor_own"
  ON public.mentor_assignments FOR SELECT
  USING (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
  );

CREATE POLICY "mentor_assignments_select_mentee_own"
  ON public.mentor_assignments FOR SELECT
  USING (
    public.current_role() = 'mentee'
    AND public.is_assigned_mentee(student_profile_id) = TRUE
  );

CREATE POLICY "mentor_assignments_select_admin_dept"
  ON public.mentor_assignments FOR SELECT
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

-- INSERT / UPDATE / DELETE: Strictly administrators only
CREATE POLICY "mentor_assignments_insert_admin_only"
  ON public.mentor_assignments FOR INSERT
  WITH CHECK (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

CREATE POLICY "mentor_assignments_update_admin_only"
  ON public.mentor_assignments FOR UPDATE
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

CREATE POLICY "mentor_assignments_delete_admin_only"
  ON public.mentor_assignments FOR DELETE
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

-- ==============================================================================
-- POLICIES: mentor_notes
-- ==============================================================================

CREATE POLICY "mentor_notes_select_mentor_own"
  ON public.mentor_notes FOR SELECT
  USING (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
  );

CREATE POLICY "mentor_notes_select_mentee_shared"
  ON public.mentor_notes FOR SELECT
  USING (
    public.current_role() = 'mentee'
    AND public.is_assigned_mentee(student_profile_id) = TRUE
    AND visibility = 'shared_with_mentee'
  );

CREATE POLICY "mentor_notes_select_admin_dept"
  ON public.mentor_notes FOR SELECT
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
    AND visibility <> 'private_mentor_only'
  );

CREATE POLICY "mentor_notes_insert_mentor_only"
  ON public.mentor_notes FOR INSERT
  WITH CHECK (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
    AND public.is_assigned_mentor(student_profile_id) = TRUE
  );

CREATE POLICY "mentor_notes_update_mentor_author"
  ON public.mentor_notes FOR UPDATE
  USING (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
  );

CREATE POLICY "mentor_notes_delete_mentor_author"
  ON public.mentor_notes FOR DELETE
  USING (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
  );

-- ==============================================================================
-- POLICIES: mentor_recommendations
-- ==============================================================================

CREATE POLICY "mentor_recommendations_select_mentor_own"
  ON public.mentor_recommendations FOR SELECT
  USING (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
  );

CREATE POLICY "mentor_recommendations_select_mentee_own"
  ON public.mentor_recommendations FOR SELECT
  USING (
    public.current_role() = 'mentee'
    AND public.is_assigned_mentee(student_profile_id) = TRUE
  );

CREATE POLICY "mentor_recommendations_select_admin_dept"
  ON public.mentor_recommendations FOR SELECT
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

CREATE POLICY "mentor_recommendations_insert_mentor_only"
  ON public.mentor_recommendations FOR INSERT
  WITH CHECK (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
    AND public.is_assigned_mentor(student_profile_id) = TRUE
    AND status = 'pending'
  );

CREATE POLICY "mentor_recommendations_update_mentor_pending"
  ON public.mentor_recommendations FOR UPDATE
  USING (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
    AND status = 'pending'
  );

CREATE POLICY "mentor_recommendations_update_admin_decision"
  ON public.mentor_recommendations FOR UPDATE
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

CREATE POLICY "mentor_recommendations_delete_mentor_pending"
  ON public.mentor_recommendations FOR DELETE
  USING (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
    AND status = 'pending'
  );

CREATE POLICY "mentor_recommendations_delete_admin_dept"
  ON public.mentor_recommendations FOR DELETE
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

-- ==============================================================================
-- POLICIES: notifications
-- ==============================================================================

CREATE POLICY "notifications_select_recipient_own"
  ON public.notifications FOR SELECT
  USING (recipient_profile_id = public.current_profile_id());

CREATE POLICY "notifications_insert_authenticated"
  ON public.notifications FOR INSERT
  WITH CHECK (public.current_profile_id() IS NOT NULL);

CREATE POLICY "notifications_update_recipient_read"
  ON public.notifications FOR UPDATE
  USING (recipient_profile_id = public.current_profile_id())
  WITH CHECK (recipient_profile_id = public.current_profile_id());

CREATE POLICY "notifications_delete_recipient_own"
  ON public.notifications FOR DELETE
  USING (recipient_profile_id = public.current_profile_id());

-- ==============================================================================
-- POLICIES: audit_logs (Append-Only / Immutable)
-- ==============================================================================

CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  USING (public.current_role() = 'administrator');

CREATE POLICY "audit_logs_select_actor_own"
  ON public.audit_logs FOR SELECT
  USING (actor_profile_id = public.current_profile_id());

CREATE POLICY "audit_logs_insert_actor_own"
  ON public.audit_logs FOR INSERT
  WITH CHECK (actor_profile_id = public.current_profile_id());

-- Explicitly NO UPDATE OR DELETE policies for audit_logs (Strict Immutability)

-- ==============================================================================
-- SCHEMA GRANTS
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;


-- ==============================================================================
-- Migration: 20241029000005_admin_provision_faculty.sql
-- Description: RPC function allowing HOD/Administrator to provision faculty mentors
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.admin_create_faculty(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_admin_role public.app_role;
  v_admin_dept TEXT;
  v_admin_profile_id UUID;
  v_new_uid UUID;
  v_hashed_password TEXT;
  v_target_profile_id UUID;
  v_existing_profile_id UUID;
BEGIN
  -- 1. Authorization Check: Caller must be an authenticated administrator
  v_admin_role := public.current_role();
  IF v_admin_role IS NULL OR v_admin_role <> 'administrator' THEN
    RAISE EXCEPTION 'Access denied: only department administrators can provision faculty accounts.';
  END IF;

  v_admin_dept := public.current_department();
  v_admin_profile_id := public.current_profile_id();

  -- 2. Input Validation
  IF p_email IS NULL OR p_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid institutional email address format.';
  END IF;

  IF p_full_name IS NULL OR length(trim(p_full_name)) < 2 THEN
    RAISE EXCEPTION 'Full name must contain at least 2 characters.';
  END IF;

  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters.';
  END IF;

  -- 3. Check if user already exists
  SELECT id INTO v_existing_profile_id FROM public.profiles WHERE email = LOWER(TRIM(p_email));

  IF v_existing_profile_id IS NOT NULL THEN
    -- If already exists, elevate their role to 'mentor' in this department
    UPDATE public.profiles
    SET 
      role = 'mentor',
      full_name = TRIM(p_full_name),
      department = v_admin_dept,
      phone_number = COALESCE(p_phone, phone_number)
    WHERE id = v_existing_profile_id;

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, target_type, target_id, metadata)
    VALUES (
      v_admin_profile_id,
      'ELEVATED_USER_TO_FACULTY_MENTOR',
      'profiles',
      v_existing_profile_id,
      json_build_object('email', p_email, 'full_name', p_full_name, 'department', v_admin_dept)::jsonb
    );

    RETURN json_build_object(
      'success', true,
      'profile_id', v_existing_profile_id,
      'email', p_email,
      'full_name', p_full_name,
      'message', 'Existing user account elevated to Faculty Mentor.'
    );
  END IF;

  -- 4. Create new auth.users record
  v_new_uid := gen_random_uuid();
  v_hashed_password := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    v_new_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    LOWER(TRIM(p_email)),
    v_hashed_password,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    json_build_object(
      'full_name', TRIM(p_full_name),
      'department', v_admin_dept,
      'role', 'mentor',
      'phone_number', p_phone
    )::jsonb,
    NOW(),
    NOW()
  );

  -- Explicitly verify and ensure profile record is set to mentor
  UPDATE public.profiles
  SET 
    role = 'mentor',
    full_name = TRIM(p_full_name),
    department = v_admin_dept,
    phone_number = p_phone
  WHERE user_id = v_new_uid
  RETURNING id INTO v_target_profile_id;

  -- In case the trigger didn't insert into public.profiles for any reason, insert explicitly
  IF v_target_profile_id IS NULL THEN
    INSERT INTO public.profiles (user_id, role, full_name, email, department, phone_number)
    VALUES (
      v_new_uid,
      'mentor',
      TRIM(p_full_name),
      LOWER(TRIM(p_email)),
      v_admin_dept,
      p_phone
    )
    RETURNING id INTO v_target_profile_id;
  END IF;

  -- 5. Audit log
  INSERT INTO public.audit_logs (actor_profile_id, action, target_type, target_id, metadata)
  VALUES (
    v_admin_profile_id,
    'PROVISIONED_FACULTY_MENTOR',
    'profiles',
    v_target_profile_id,
    json_build_object('email', p_email, 'full_name', p_full_name, 'department', v_admin_dept)::jsonb
  );

  RETURN json_build_object(
    'success', true,
    'profile_id', v_target_profile_id,
    'email', p_email,
    'full_name', p_full_name,
    'message', 'Faculty Mentor successfully provisioned.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_faculty(TEXT, TEXT, TEXT, TEXT) TO authenticated;
