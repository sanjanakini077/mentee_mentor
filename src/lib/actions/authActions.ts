'use server'

import prisma from '@/lib/prisma'
import {
  setSessionCookie,
  clearSessionCookie,
  getSessionUser,
  requireAuthUser,
} from '@/lib/auth/session'
import { seedDemoData } from '@/lib/db/seedHelper'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import type { Profile } from '@/types'

export async function loginAction(
  identifier: string,
  password?: string
): Promise<{ success: boolean; user?: Profile; error?: string }> {
  try {
    let email = identifier.trim().toLowerCase()
    if (email === 'student') email = 'student@demo.com'
    if (email === 'mentor' || email === 'faculty') email = 'mentor@demo.com'
    if (email === 'hod' || email === 'admin') email = 'hod@demo.com'

    const profile = await prisma.profile.findUnique({
      where: { email },
    })

    if (!profile) {
      return { success: false, error: `Account with email '${email}' not found.` }
    }

    // Verify password using hash with plaintext fallback for initial demo accounts
    if (password && !verifyPassword(password, profile.password)) {
      return { success: false, error: 'Invalid password. (Default is demo123)' }
    }

    await setSessionCookie(profile.id, profile.email, profile.role)

    const user: Profile = {
      id: profile.id,
      user_id: profile.user_id || profile.id,
      role: profile.role as any,
      full_name: profile.full_name,
      email: profile.email,
      department: profile.department,
      phone_number: profile.phone_number || undefined,
      avatar_url: profile.avatar_url || undefined,
      created_at: profile.created_at.toISOString(),
      updated_at: profile.updated_at.toISOString(),
    }

    return { success: true, user }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Authentication failed' }
  }
}

export async function logoutAction(): Promise<{ success: boolean }> {
  await clearSessionCookie()
  return { success: true }
}

export async function getCurrentUserAction(
  fallbackRole?: 'mentee' | 'mentor' | 'administrator' | 'hod'
): Promise<Profile | null> {
  return await getSessionUser(fallbackRole)
}

export async function resetDemoDataAction(): Promise<{ success: boolean }> {
  try {
    await seedDemoData()
    return { success: true }
  } catch (err: any) {
    return { success: false }
  }
}

/**
 * Self-registration for students
 */
export async function registerStudentAction(params: {
  fullName: string
  email: string
  usn: string
  department: string
  semester: number
  phoneNumber: string
  password?: string
  confirmPassword?: string
}): Promise<{ success: boolean; user?: Profile; error?: string }> {
  try {
    const fullName = params.fullName?.trim() || ''
    const email = params.email?.trim().toLowerCase() || ''
    const usn = params.usn?.trim().toUpperCase() || ''
    const department = params.department?.trim() || 'Information Science & Engineering'
    const semester = Number(params.semester) || 1
    const phoneNumber = params.phoneNumber?.trim() || ''
    const password = params.password || ''
    const confirmPassword = params.confirmPassword || ''

    // 1. Validation
    if (!fullName || fullName.length < 2) {
      return { success: false, error: 'Full legal name is required (min 2 characters).' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return { success: false, error: 'Please enter a valid email address.' }
    }

    if (!usn || usn.length < 5) {
      return { success: false, error: 'Valid University Seat Number (USN) is required.' }
    }

    if (!phoneNumber || phoneNumber.length < 7) {
      return { success: false, error: 'Valid contact phone number is required.' }
    }

    if (semester < 1 || semester > 8) {
      return { success: false, error: 'Semester must be between 1 and 8.' }
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' }
    }

    if (confirmPassword && password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match.' }
    }

    // 2. Uniqueness checks
    const existingEmail = await prisma.profile.findUnique({
      where: { email },
    })
    if (existingEmail) {
      return { success: false, error: `An account with email '${email}' already exists.` }
    }

    const existingUsn = await prisma.studentProfile.findUnique({
      where: { usn },
    })
    if (existingUsn) {
      return { success: false, error: `A student profile with USN '${usn}' is already registered.` }
    }

    // 3. Securely hash password
    const hashedPassword = hashPassword(password)

    // 4. Atomic transaction in SQLite
    const created = await prisma.$transaction(async (tx) => {
      const prof = await tx.profile.create({
        data: {
          email,
          full_name: fullName,
          role: 'mentee',
          department,
          phone_number: phoneNumber,
          password: hashedPassword,
        },
      })

      await tx.profile.update({
        where: { id: prof.id },
        data: { user_id: prof.id },
      })

      const currentYear = new Date().getFullYear()
      const batchStart = semester <= 2 ? currentYear : currentYear - Math.floor((semester - 1) / 2)
      const academicBatch = `${batchStart}-${batchStart + 4}`

      await tx.studentProfile.create({
        data: {
          profile_id: prof.id,
          usn,
          department,
          semester,
          academic_batch: academicBatch,
          phone: phoneNumber,
          verification_status: 'draft',
        },
      })

      return prof
    })

    // 5. Establish authenticated session
    await setSessionCookie(created.id, created.email, created.role)

    const user: Profile = {
      id: created.id,
      user_id: created.id,
      role: 'mentee',
      full_name: created.full_name,
      email: created.email,
      department: created.department,
      phone_number: created.phone_number || undefined,
      created_at: created.created_at.toISOString(),
      updated_at: created.updated_at.toISOString(),
    }

    return { success: true, user }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Registration failed' }
  }
}

/**
 * Faculty mentor registration exclusively by authenticated Department HOD
 */
export async function registerFacultyMentorAction(params: {
  fullName: string
  email: string
  employeeId?: string
  department: string
  phoneNumber: string
  password?: string
  confirmPassword?: string
}): Promise<{ success: boolean; profile?: Profile; error?: string }> {
  try {
    // 1. Authorization: Only authenticated HOD / Administrator
    const admin = await requireAuthUser(['administrator', 'hod'])

    const fullName = params.fullName?.trim() || ''
    const email = params.email?.trim().toLowerCase() || ''
    const employeeId = params.employeeId?.trim() || null
    const department = params.department?.trim() || admin.department || 'Information Science & Engineering'
    const phoneNumber = params.phoneNumber?.trim() || ''
    const password = params.password || ''
    const confirmPassword = params.confirmPassword || ''

    // 2. Validate fields
    if (!fullName || fullName.length < 2) {
      return { success: false, error: 'Faculty full name is required (min 2 characters).' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return { success: false, error: 'Please enter a valid institutional email address.' }
    }

    if (!phoneNumber || phoneNumber.length < 7) {
      return { success: false, error: 'Valid contact phone number is required.' }
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Initial password must be at least 6 characters.' }
    }

    if (confirmPassword && password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match.' }
    }

    // 3. Uniqueness checks
    const existingEmail = await prisma.profile.findUnique({
      where: { email },
    })
    if (existingEmail) {
      return { success: false, error: `An account with email '${email}' is already registered.` }
    }

    if (employeeId) {
      const existingEmpId = await prisma.profile.findUnique({
        where: { employee_id: employeeId },
      })
      if (existingEmpId) {
        return { success: false, error: `Employee ID '${employeeId}' is already assigned to another faculty member.` }
      }
    }

    // 4. Securely hash password
    const hashedPassword = hashPassword(password)

    // 5. Create Profile with strict MENTOR role (cannot create HOD)
    const created = await prisma.profile.create({
      data: {
        email,
        full_name: fullName,
        role: 'mentor',
        department,
        employee_id: employeeId,
        phone_number: phoneNumber,
        password: hashedPassword,
      },
    })

    await prisma.profile.update({
      where: { id: created.id },
      data: { user_id: created.id },
    })

    // 6. Audit log
    await prisma.auditLog.create({
      data: {
        actor_profile_id: admin.id,
        action: 'REGISTERED_FACULTY_MENTOR',
        target_type: 'profiles',
        target_id: created.id,
        metadata: JSON.stringify({
          faculty_name: fullName,
          email,
          employee_id: employeeId,
          department,
        }),
      },
    })

    const profile: Profile = {
      id: created.id,
      user_id: created.id,
      role: 'mentor',
      full_name: created.full_name,
      email: created.email,
      department: created.department,
      employee_id: created.employee_id || undefined,
      phone_number: created.phone_number || undefined,
      created_at: created.created_at.toISOString(),
      updated_at: created.updated_at.toISOString(),
    }

    return { success: true, profile }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Faculty registration failed.' }
  }
}
