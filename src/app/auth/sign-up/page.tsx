'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Mail, Lock, User, IdCard, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'

const departments = [
  'Computer Science and Engineering',
  'Information Science and Engineering',
  'Electronics and Communication Engineering',
  'Mechanical Engineering',
  'Electrical and Electronics Engineering',
  'Civil Engineering',
]

export default function SignUpPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [usn, setUsn] = useState('')
  const [department, setDepartment] = useState(departments[0])
  const [semester, setSemester] = useState(1)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (!usn.trim()) {
      setError('University Seat Number (USN) is required.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Enforce role strictly on the server: role is ALWAYS 'mentee' for self-registration
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'mentee', // Fixed: Non-negotiable client self-registration role
            department,
            usn: usn.trim().toUpperCase(),
            semester,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      const userId = data.user?.id
      if (!userId) {
        setError('Account creation failed. Please try again.')
        return
      }

      // Ensure profile record is created in profiles table
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      let profileId = existingProfile?.id

      if (!profileId) {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            role: 'mentee', // Hardcoded mentee role
            full_name: fullName.trim(),
            email: email.trim(),
            department,
          })
          .select('id')
          .single()

        if (profileError && profileError.code !== '23505') {
          console.warn('Profile insert notice:', profileError)
        } else if (newProfile) {
          profileId = newProfile.id
        }
      }

      // Ensure student_profiles record exists if profileId is available
      if (profileId) {
        const { error: studentProfileError } = await supabase
          .from('student_profiles')
          .insert({
            profile_id: profileId,
            usn: usn.trim().toUpperCase(),
            department,
            semester,
            academic_batch: `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
          })
        if (studentProfileError && studentProfileError.code !== '23505') {
          console.warn('Student profile insert notice:', studentProfileError)
        }
      }

      // Redirect student to their dedicated dashboard
      router.push('/mentee/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to complete registration.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-md shadow-sm p-7">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center mb-3 text-white shadow-xs">
              <GraduationCap size={24} />
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight text-center">
              Student Registration
            </h1>
            <p className="text-xs text-slate-500 text-center mt-0.5">
              Mentor–Mentee Management System
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label htmlFor="fullName" required>
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="e.g. Rohan Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User size={15} />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="usn" required>
                  University Seat No. (USN)
                </Label>
                <Input
                  id="usn"
                  type="text"
                  placeholder="e.g. 1MS21CS084"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value.toUpperCase())}
                  className="font-mono uppercase"
                  leftIcon={<IdCard size={15} />}
                  required
                />
              </div>

              <div>
                <Label htmlFor="semester" required>
                  Current Semester
                </Label>
                <Select
                  id="semester"
                  value={semester}
                  onChange={(e) => setSemester(parseInt(e.target.value) || 1)}
                  options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
                    value: s,
                    label: `Semester ${s}`,
                  }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="department" required>
                Engineering Department
              </Label>
              <Select
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={departments.map((d) => ({ value: d, label: d }))}
              />
            </div>

            <div>
              <Label htmlFor="email" required>
                Institutional Email Address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="student.name@eng.college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={15} />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="password" required>
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min 8 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock size={15} />}
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" required>
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock size={15} />}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full"
            >
              Register Student Account
            </Button>
          </form>

          {/* Institutional Provisioning Notice */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link
                href="/auth/sign-in"
                className="text-accent font-semibold hover:underline"
              >
                Sign in to ERP
              </Link>
            </p>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500 text-left">
              <strong className="text-slate-700 block mb-0.5">
                Faculty & Administrator Notice:
              </strong>
              Faculty Mentor and HOD accounts are provisioned exclusively through
              the Department Administration Office. Self-registration is restricted
              to students.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
