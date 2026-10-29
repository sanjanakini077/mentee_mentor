-- ==============================================================================
-- College Mentor–Mentee Management System
-- Initial Account Provisioning & Role Elevation Scripts
-- File: supabase/seed_initial_accounts.sql
-- ==============================================================================

-- ==============================================================================
-- OVERVIEW & SECURITY MODEL
-- ==============================================================================
-- In this college ERP architecture:
-- 1. Public self-registration (via /auth/sign-up) is strictly restricted to Mentees (Students).
--    The database trigger `handle_new_auth_user()` unconditionally sets the role to 'mentee',
--    ignoring any forged role metadata.
-- 2. Faculty Mentors and HOD Administrators CANNOT be self-registered.
-- 3. The initial HOD / Administrator account must be provisioned either by:
--    a) Signing up normally, then elevating the role via SQL in Supabase SQL Editor.
--    b) Directly inserting into `auth.users` and `public.profiles` via database superuser.
-- 4. Subsequent mentors can be provisioned by the HOD through SQL or administrative RPC.
-- ==============================================================================

-- ==============================================================================
-- METHOD A: Promote an Existing Registered User to HOD / Administrator
-- ==============================================================================
-- Step 1: Have the HOD sign up through the application at /auth/sign-up or create
--         the user in Supabase Dashboard > Authentication > Users ("Add User").
--         Example email: hod.ise@nmamit.in
--
-- Step 2: Run the following SQL snippet in the Supabase Dashboard SQL Editor:

DO $$
DECLARE
  target_email TEXT := 'hod.ise@nmamit.in';
BEGIN
  -- Update profile to administrator role and assign Department
  UPDATE public.profiles
  SET 
    role = 'administrator',
    full_name = 'HOD ISE (NMAMIT)',
    department = 'Information Science & Engineering',
    phone_number = '+91 98765 43210'
  WHERE email = target_email;

  IF NOT FOUND THEN
    RAISE NOTICE 'No profile found with email %; ensure user is registered in auth.users first.', target_email;
  ELSE
    RAISE NOTICE 'User % has been successfully elevated to HOD Administrator.', target_email;
  END IF;
END;
$$;


-- ==============================================================================
-- METHOD B: Promote an Existing User to Faculty Mentor
-- ==============================================================================
-- Step 1: Create the faculty account in Supabase Dashboard > Authentication > Users
--         Example email: prof.sharma@college.edu
--
-- Step 2: Run this snippet to assign the mentor role:

DO $$
DECLARE
  target_email TEXT := 'prof.sharma@college.edu';
BEGIN
  UPDATE public.profiles
  SET 
    role = 'mentor',
    full_name = 'Prof. A. N. Sharma',
    department = 'Computer Science & Engineering',
    phone_number = '+91 98450 11223'
  WHERE email = target_email;

  IF NOT FOUND THEN
    RAISE NOTICE 'No profile found with email %; ensure user is registered first.', target_email;
  ELSE
    RAISE NOTICE 'User % has been designated as Faculty Mentor.', target_email;
  END IF;
END;
$$;


-- ==============================================================================
-- METHOD C: Standalone Seed Script (Creates Test Accounts with Passwords)
-- Suitable for Local Development / Staging Supabase Projects
-- Password for all seed accounts: "College@2024!"
-- ==============================================================================

-- Enable pgcrypto for password hashing if not already active
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_hod_uid UUID := gen_random_uuid();
  v_mentor_uid UUID := gen_random_uuid();
  v_mentor2_uid UUID := gen_random_uuid();
  v_student_uid UUID := gen_random_uuid();
  v_student2_uid UUID := gen_random_uuid();
  v_hashed_password TEXT;
  v_student_profile_id UUID;
  v_student2_profile_id UUID;
  v_mentor_profile_id UUID;
  v_mentor2_profile_id UUID;
BEGIN
  -- Generate bcrypt hash for default test password: 'College@2024!'
  v_hashed_password := extensions.crypt('College@2024!', extensions.gen_salt('bf', 10));

  -- 1. Create HOD Administrator User
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'hod.ise@nmamit.in') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      v_hod_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'hod.ise@nmamit.in', v_hashed_password, NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Dr. Balasubramani R (HOD ISE)","department":"Information Science & Engineering","role":"administrator"}',
      NOW(), NOW()
    );

    -- Elevate profile explicitly to administrator
    UPDATE public.profiles
    SET role = 'administrator', full_name = 'Dr. Balasubramani R (HOD ISE)', department = 'Information Science & Engineering'
    WHERE user_id = v_hod_uid;
    
    RAISE NOTICE 'Created HOD account: hod.ise@nmamit.in / College@2024!';
  END IF;

  -- 2. Create Faculty Mentor 1 (Prof. Sunita Rao)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mentor.cse@college.edu') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      v_mentor_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'mentor.cse@college.edu', v_hashed_password, NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Prof. Sunita Rao","department":"Computer Science & Engineering","role":"mentor"}',
      NOW(), NOW()
    );

    UPDATE public.profiles
    SET role = 'mentor', full_name = 'Prof. Sunita Rao', department = 'Computer Science & Engineering'
    WHERE user_id = v_mentor_uid;

    RAISE NOTICE 'Created Mentor 1 account: mentor.cse@college.edu / College@2024!';
  END IF;

  -- 3. Create Faculty Mentor 2 (Dr. Rajesh Varma) for cross-mentor isolation testing
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mentor2.cse@college.edu') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      v_mentor2_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'mentor2.cse@college.edu', v_hashed_password, NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Dr. Rajesh Varma","department":"Computer Science & Engineering","role":"mentor"}',
      NOW(), NOW()
    );

    UPDATE public.profiles
    SET role = 'mentor', full_name = 'Dr. Rajesh Varma', department = 'Computer Science & Engineering'
    WHERE user_id = v_mentor2_uid;

    RAISE NOTICE 'Created Mentor 2 account: mentor2.cse@college.edu / College@2024!';
  END IF;

  -- 4. Create Mentee Student 1 (Aarav Sharma - Assigned to Mentor 1)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'student.cse@college.edu') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      v_student_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'student.cse@college.edu', v_hashed_password, NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Aarav Sharma","department":"Computer Science & Engineering","usn":"1RV21CS001","semester":"5"}',
      NOW(), NOW()
    );

    -- Ensure student_profiles record exists with verified status for testing
    SELECT id INTO v_student_profile_id FROM public.student_profiles WHERE usn = '1RV21CS001';
    IF v_student_profile_id IS NOT NULL THEN
      UPDATE public.student_profiles
      SET verification_status = 'approved'
      WHERE id = v_student_profile_id;

      -- Assign to Mentor 1
      SELECT id INTO v_mentor_profile_id FROM public.profiles WHERE email = 'mentor.cse@college.edu';
      IF v_mentor_profile_id IS NOT NULL THEN
        INSERT INTO public.mentor_assignments (
          student_profile_id, mentor_profile_id, is_active, notes
        ) VALUES (
          v_student_profile_id, v_mentor_profile_id, TRUE, 'Assigned to Prof. Sunita Rao'
        ) ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    RAISE NOTICE 'Created Student 1: student.cse@college.edu / College@2024! (Assigned to Mentor 1)';
  END IF;

  -- 5. Create Mentee Student 2 (Bhavna Patel - Assigned to Mentor 2)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'student2.cse@college.edu') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      v_student2_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'student2.cse@college.edu', v_hashed_password, NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Bhavna Patel","department":"Computer Science & Engineering","usn":"1RV21CS002","semester":"5"}',
      NOW(), NOW()
    );

    SELECT id INTO v_student2_profile_id FROM public.student_profiles WHERE usn = '1RV21CS002';
    IF v_student2_profile_id IS NOT NULL THEN
      UPDATE public.student_profiles
      SET verification_status = 'submitted'
      WHERE id = v_student2_profile_id;

      -- Assign to Mentor 2
      SELECT id INTO v_mentor2_profile_id FROM public.profiles WHERE email = 'mentor2.cse@college.edu';
      IF v_mentor2_profile_id IS NOT NULL THEN
        INSERT INTO public.mentor_assignments (
          student_profile_id, mentor_profile_id, is_active, notes
        ) VALUES (
          v_student2_profile_id, v_mentor2_profile_id, TRUE, 'Assigned to Dr. Rajesh Varma'
        ) ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    RAISE NOTICE 'Created Student 2: student2.cse@college.edu / College@2024! (Assigned to Mentor 2)';
  END IF;

END;
$$;


-- ==============================================================================
-- METHOD D: Administrative Stored Procedure for HOD to Provision Mentors
-- Allows an authenticated Administrator to provision faculty accounts securely
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_provision_faculty(
  p_email TEXT,
  p_full_name TEXT,
  p_department TEXT,
  p_phone_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role public.app_role;
  v_existing_profile_id UUID;
BEGIN
  -- Strict permission check
  v_caller_role := public.current_role();
  IF v_caller_role IS NULL OR v_caller_role <> 'administrator' THEN
    RAISE EXCEPTION 'Access denied: Only department administrators can provision faculty accounts.';
  END IF;

  -- Check if user profile already exists
  SELECT id INTO v_existing_profile_id FROM public.profiles WHERE LOWER(email) = LOWER(TRIM(p_email));
  
  IF v_existing_profile_id IS NOT NULL THEN
    -- Elevate existing user to mentor
    UPDATE public.profiles
    SET 
      role = 'mentor',
      full_name = p_full_name,
      department = COALESCE(p_department, department),
      phone_number = COALESCE(p_phone_number, phone_number)
    WHERE id = v_existing_profile_id;

    RETURN jsonb_build_object(
      'status', 'success',
      'message', 'Existing user successfully designated as Faculty Mentor.',
      'profile_id', v_existing_profile_id
    );
  ELSE
    RETURN jsonb_build_object(
      'status', 'pending_invitation',
      'message', 'User not yet registered. Have faculty sign up or send Supabase Auth invite to: ' || p_email
    );
  END IF;
END;
$$;

