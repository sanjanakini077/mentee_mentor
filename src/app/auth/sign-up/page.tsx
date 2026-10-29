'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  IdCard,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { registerStudentAction } from '@/lib/actions/authActions'

const departments = [
  'Information Science & Engineering',
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence & Machine Learning',
]

export default function SignUpPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [usn, setUsn] = useState('')
  const [department, setDepartment] = useState(departments[0])
  const [semester, setSemester] = useState(1)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please provide a valid institutional email address.')
      return
    }

    if (!usn.trim()) {
      setError('University Seat Number (USN) is required.')
      return
    }

    if (!phoneNumber.trim()) {
      setError('Contact phone number is required.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)

    const res = await registerStudentAction({
      fullName,
      email,
      usn,
      department,
      semester,
      phoneNumber,
      password,
      confirmPassword,
    })

    setIsLoading(false)

    if (!res.success) {
      setError(res.error || 'Failed to create student account.')
      return
    }

    setSuccessMsg('Account created successfully! Entering student portal...')
    setTimeout(() => {
      router.push('/mentee/dashboard')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 py-10">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-sm mb-4">
            <GraduationCap size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Register as Student
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create your institutional mentee profile • Academic Session 2024–2025
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Full Name */}
            <div>
              <Label htmlFor="fullName" required>
                Full Legal Name
              </Label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Sanjana Kini"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="pl-9"
                />
              </div>
            </div>

            {/* Email Address & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" required>
                  Institutional Email
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
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phoneNumber" required>
                  Phone Number
                </Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone size={16} />
                  </div>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+91 98450 12345"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="pl-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* USN & Semester */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usn" required>
                  University Seat Number (USN)
                </Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <IdCard size={16} />
                  </div>
                  <Input
                    id="usn"
                    type="text"
                    placeholder="4NM21IS042"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value)}
                    required
                    className="pl-9 uppercase font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="semester" required>
                  Current Semester
                </Label>
                <Select
                  id="semester"
                  value={String(semester)}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="mt-1 text-xs"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Department */}
            <div>
              <Label htmlFor="department" required>
                Department
              </Label>
              <div className="relative mt-1">
                <Select
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="text-xs"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password" required>
                  Password (min 6 chars)
                </Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" required>
                  Confirm Password
                </Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
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
              <span>Complete Student Registration</span>
            </Button>
          </form>

          <div className="text-center pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <span>Already have an account?</span>
            <Link
              href="/auth/sign-in"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
