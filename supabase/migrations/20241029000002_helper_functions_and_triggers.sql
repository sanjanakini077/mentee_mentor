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

  -- If role is changing, ensure caller is an administrator
  IF NEW.role <> OLD.role THEN
    v_caller_role := public.current_role();
    IF v_caller_role IS NULL OR v_caller_role <> 'administrator' THEN
      RAISE EXCEPTION 'Privilege escalation rejected: only administrators can alter role assignments.';
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
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
  v_full_name TEXT;
  v_department TEXT;
  v_profile_id UUID;
  v_raw_role TEXT;
BEGIN
  -- Read role safely from user raw metadata
  v_raw_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'mentee'));
  IF v_raw_role IN ('mentor', 'faculty') THEN
    v_role := 'mentor';
  ELSIF v_raw_role IN ('administrator', 'hod', 'admin') THEN
    v_role := 'administrator';
  ELSE
    v_role := 'mentee';
  END IF;

  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1));
  v_department := COALESCE(NEW.raw_user_meta_data->>'department', 'General Engineering');

  INSERT INTO public.profiles (user_id, role, full_name, email, department, phone_number)
  VALUES (
    NEW.id,
    v_role,
    v_full_name,
    NEW.email,
    v_department,
    NEW.raw_user_meta_data->>'phone_number'
  )
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
END;
$$;

-- Trigger attached to auth.users (runs automatically in Supabase)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

