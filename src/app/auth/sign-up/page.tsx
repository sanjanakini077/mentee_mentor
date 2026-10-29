'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Mail, Lock, User, IdCard } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { getStore, saveStore, setCurrentUser } from '@/lib/storage/demoStore'
import type { Profile, StudentProfile } from '@/types'

const departments = [
  'Information Science and Engineering',
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Mechanical Engineering',
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

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!usn.trim()) {
      setError('University Seat Number (USN) is required.')
      return
    }

    setIsLoading(true)

    try {
      const store = getStore()
      const newUserId = `u-student-${Date.now()}`
      const newProfileId = `p-student-${Date.now()}`

      const newProfile: Profile = {
        id: newProfileId,
        user_id: newUserId,
        role: 'mentee',
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        department,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const newStudentProfile: StudentProfile = {
        id: `sp-${Date.now()}`,
        profile_id: newProfileId,
        usn: usn.trim().toUpperCase(),
        department,
        semester: Number(semester) || 1,
        academic_batch: '2024-2028',
        verification_status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      store.profiles.push(newProfile)
      store.studentProfiles.push(newStudentProfile)
      store.currentUser = newProfile
      saveStore(store)

      router.push('/mentee/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Failed to create student account.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-sm mb-4">
            <GraduationCap size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Register as Student
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create your mentee profile in the Institutional ERP
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label htmlFor="fullName" required>
                Full Name
              </Label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" required>
                Email Address
              </Label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="usn" required>
                  USN
                </Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <IdCard size={16} />
                  </div>
                  <Input
                    id="usn"
                    type="text"
                    placeholder="4NM21IS001"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value)}
                    required
                    className="pl-9 uppercase font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="semester" required>
                  Semester
                </Label>
                <Select
                  id="semester"
                  value={String(semester)}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="mt-1"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="department" required>
                Department
              </Label>
              <Select
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 text-xs"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="password" required>
                  Password
                </Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" required>
                  Confirm
                </Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 mt-2"
              isLoading={isLoading}
            >
              Complete Registration
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link href="/auth/sign-in" className="font-semibold text-blue-600 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
