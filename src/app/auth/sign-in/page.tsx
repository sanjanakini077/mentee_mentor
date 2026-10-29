'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Mail, Lock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectToParam = searchParams.get('redirectTo')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (!data.user) {
        setError('Authentication session not established. Please try again.')
        return
      }

      // Query trusted profile record to fetch role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single()

      if (profileError || !profile) {
        // Fallback default role
        router.push('/mentee/dashboard')
        return
      }

      // Check safe redirectTo parameter
      if (
        redirectToParam &&
        redirectToParam.startsWith('/') &&
        !redirectToParam.startsWith('//')
      ) {
        // Ensure redirect matches their role portal or general page
        const role = profile.role
        const isAllowedPath =
          (role === 'mentee' && redirectToParam.startsWith('/mentee')) ||
          (role === 'mentor' && redirectToParam.startsWith('/mentor')) ||
          ((role === 'administrator' || (role as string) === 'hod') &&
            (redirectToParam.startsWith('/admin') ||
              redirectToParam.startsWith('/hod')))

        if (isAllowedPath) {
          router.push(redirectToParam)
          return
        }
      }

      // Role-based redirect
      switch (profile.role) {
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
    }
  }

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
          <form className="space-y-4" onSubmit={handleSignIn}>
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
                  placeholder="name@college.edu"
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
              Sign In to ERP
            </Button>
          </form>

          {/* Student Registration Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center space-y-2">
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
