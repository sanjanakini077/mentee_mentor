'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap,
  Mail,
  Lock,
  AlertCircle,
  UserCheck,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

type ActivePortalRole = 'student' | 'faculty' | 'hod'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectToParam = searchParams.get('redirectTo')

  const [selectedRole, setSelectedRole] = useState<ActivePortalRole>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<'form' | 'faculty' | 'hod' | null>(null)

  const executeSignIn = async (
    targetEmail: string,
    targetPassword: string,
    actionType: 'form' | 'faculty' | 'hod' = 'form'
  ) => {
    if (!targetEmail.trim() || !targetPassword) {
      setError('Please provide both institutional email address and password.')
      return
    }

    setError(null)
    setIsLoading(true)
    setActiveAction(actionType)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail.trim(),
        password: targetPassword,
      })

      if (authError) {
        if (authError.message.toLowerCase().includes('invalid login credentials')) {
          setError(
            `Invalid credentials for ${targetEmail.trim()}. If you just created this account, make sure the user exists in Supabase Auth (or run the seed SQL script in your Supabase SQL Editor).`
          )
        } else {
          setError(authError.message)
        }
        return
      }

      if (!data.user) {
        setError('Authentication session could not be established. Please try again.')
        return
      }

      // Query trusted profile record to fetch role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single()

      const userRole = profile?.role || 'mentee'

      // Check safe redirectTo parameter
      if (
        redirectToParam &&
        redirectToParam.startsWith('/') &&
        !redirectToParam.startsWith('//')
      ) {
        const isAllowedPath =
          (userRole === 'mentee' && redirectToParam.startsWith('/mentee')) ||
          (userRole === 'mentor' && redirectToParam.startsWith('/mentor')) ||
          ((userRole === 'administrator' || (userRole as string) === 'hod') &&
            (redirectToParam.startsWith('/admin') ||
              redirectToParam.startsWith('/hod')))

        if (isAllowedPath) {
          router.push(redirectToParam)
          return
        }
      }

      // Role-based redirect
      switch (userRole) {
        case 'mentor':
          router.push('/mentor/dashboard')
          break
        case 'administrator':
        case 'hod' as any:
          router.push('/admin/dashboard')
          break
        case 'mentee':
        default:
          router.push('/mentee/dashboard')
          break
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during sign-in.')
    } finally {
      setIsLoading(false)
      setActiveAction(null)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    executeSignIn(email, password, 'form')
  }

  const handleFacultyClick = () => {
    // If user already typed their email/password, use them; otherwise use default demo credentials
    const targetEmail = email.trim() || 'mentor.cse@college.edu'
    const targetPassword = password || 'College@2024!'
    setEmail(targetEmail)
    setPassword(targetPassword)
    setSelectedRole('faculty')
    executeSignIn(targetEmail, targetPassword, 'faculty')
  }

  const handleHodClick = () => {
    // If user already typed their email/password, use them; otherwise use default demo credentials
    const targetEmail = email.trim() || 'hod.ise@nmamit.in'
    const targetPassword = password || 'College@2024!'
    setEmail(targetEmail)
    setPassword(targetPassword)
    setSelectedRole('hod')
    executeSignIn(targetEmail, targetPassword, 'hod')
  }

  const roleMeta = {
    student: {
      title: 'Student Sign-In',
      buttonText: 'Sign In as Student',
      placeholder: 'student@college.edu',
    },
    faculty: {
      title: 'Faculty Mentor Sign-In',
      buttonText: 'Sign In as Faculty Mentor',
      placeholder: 'mentor.cse@college.edu',
    },
    hod: {
      title: 'Department HOD Sign-In',
      buttonText: 'Sign In as Department HOD',
      placeholder: 'hod.ise@nmamit.in',
    },
  }[selectedRole]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent text-white shadow-sm mb-3">
          <GraduationCap size={28} />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Mentor–Mentee Management System
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Institutional ERP Portal • Academic Session 2024–2025
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xs border border-slate-200 rounded-lg sm:px-10">
          {/* Role Selection Tabs */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('student')
                  setError(null)
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all ${
                  selectedRole === 'student'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap size={14} className="text-blue-600" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('faculty')
                  setError(null)
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all ${
                  selectedRole === 'faculty'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck size={14} className="text-emerald-600" />
                <span>Faculty</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('hod')
                  setError(null)
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all ${
                  selectedRole === 'hod'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck size={14} className="text-purple-600" />
                <span>HOD</span>
              </button>
            </div>

            <div className="mt-2.5 text-center">
              <span className="text-[11px] font-medium text-slate-500">
                Active Portal: <strong className="text-slate-800">{roleMeta.title}</strong>
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleFormSubmit}>
            <div>
              <Label htmlFor="email" required>
                Institutional Email Address
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder={roleMeta.placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail size={16} />}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" required>
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-accent hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock size={16} />}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading && activeAction === 'form'}
              className="w-full"
            >
              {roleMeta.buttonText}
            </Button>
          </form>

          {/* Quick Direct Login Buttons for Faculty & HOD */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              Instant One-Click Login
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isLoading && activeAction === 'faculty'}
                onClick={handleFacultyClick}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 text-xs font-semibold"
              >
                <UserCheck size={15} className="text-emerald-600 shrink-0" />
                <span>Faculty Login</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isLoading && activeAction === 'hod'}
                onClick={handleHodClick}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 border-slate-300 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-800 text-xs font-semibold"
              >
                <ShieldCheck size={15} className="text-purple-600 shrink-0" />
                <span>HOD Login</span>
              </Button>
            </div>
          </div>

          {/* Student Registration Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center space-y-1.5">
            <p className="text-xs text-slate-500">
              New student?{' '}
              <Link
                href="/auth/sign-up"
                className="text-accent font-semibold hover:underline"
              >
                Register as Student
              </Link>
            </p>
            <p className="text-[11px] text-slate-400">
              Faculty and HOD accounts are provisioned administratively.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  )
}
