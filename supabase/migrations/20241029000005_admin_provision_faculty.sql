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

-- Grant execution to authenticated users (RLS & internal check verifies administrator role)
GRANT EXECUTE ON FUNCTION public.admin_create_faculty(TEXT, TEXT, TEXT, TEXT) TO authenticated;

