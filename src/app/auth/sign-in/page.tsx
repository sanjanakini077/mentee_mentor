'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, ArrowRight, ShieldCheck, UserCheck, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import type { Role } from '@/types'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      // Fetch profile to get role for redirect
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Authentication failed. Please try again.')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      const roleRedirectMap: Record<Role, string> = {
        mentee: '/mentee',
        mentor: '/mentor',
        hod: '/hod',
        administrator: '/hod',
      }

      if (profile?.role && profile.role in roleRedirectMap) {
        router.push(roleRedirectMap[profile.role as Role])
      } else {
        router.push('/mentee')
      }
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Main Card */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm p-7">
          {/* Institution Monogram & Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center mb-3 text-white shadow-xs">
              <GraduationCap size={24} />
            </div>
            <h1 className="text-base font-bold text-slate-900 text-center tracking-tight">
              Mentor–Mentee System
            </h1>
            <p className="text-xs text-slate-500 text-center mt-0.5">
              College of Engineering • ERP Portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" required>
                Institutional Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="username@eng.college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password" required>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                {error}
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

          {/* Create Account Link */}
          <p className="mt-5 text-center text-xs text-slate-500">
            Need an account?{' '}
            <Link
              href="/auth/sign-up"
              className="text-accent font-semibold hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>

        {/* Phase 1 Portal Navigation Preview Launcher */}
        <div className="bg-white border border-slate-200 rounded-md p-4 text-xs shadow-xs">
          <p className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider mb-2">
            Explore Portal Layouts
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Link
              href="/mentee"
              className="p-2 border border-slate-200 rounded hover:border-accent hover:bg-blue-50/50 transition-colors text-center group"
            >
              <User size={14} className="mx-auto text-slate-500 group-hover:text-accent mb-1" />
              <span className="font-semibold text-slate-700 group-hover:text-accent block text-[11px]">
                Student
              </span>
            </Link>
            <Link
              href="/mentor"
              className="p-2 border border-slate-200 rounded hover:border-accent hover:bg-blue-50/50 transition-colors text-center group"
            >
              <UserCheck size={14} className="mx-auto text-slate-500 group-hover:text-accent mb-1" />
              <span className="font-semibold text-slate-700 group-hover:text-accent block text-[11px]">
                Mentor
              </span>
            </Link>
            <Link
              href="/hod"
              className="p-2 border border-slate-200 rounded hover:border-accent hover:bg-blue-50/50 transition-colors text-center group"
            >
              <ShieldCheck size={14} className="mx-auto text-slate-500 group-hover:text-accent mb-1" />
              <span className="font-semibold text-slate-700 group-hover:text-accent block text-[11px]">
                HOD
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
