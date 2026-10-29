'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import type { Role } from '@/types'
import { cn } from '@/lib/utils'

interface RoleOption {
  value: Role
  label: string
  description: string
}

const roleOptions: RoleOption[] = [
  {
    value: 'mentee',
    label: 'Student (Mentee)',
    description: 'Track academic progress, manage records, submit for verification',
  },
  {
    value: 'mentor',
    label: 'Faculty Mentor',
    description: 'Counsel assigned students, log session notes, make recommendations',
  },
  {
    value: 'hod',
    label: 'HOD / Admin',
    description: 'Departmental oversight, student verification, mentor allocation',
  },
]

const departments = [
  'Computer Science and Engineering',
  'Information Science and Engineering',
  'Electronics and Communication Engineering',
  'Mechanical Engineering',
  'Electrical and Electronics Engineering',
  'Civil Engineering',
]

const roleRedirectMap: Record<Role, string> = {
  mentee: '/mentee',
  mentor: '/mentor',
  hod: '/hod',
  administrator: '/hod',
}

export default function SignUpPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<Role>('mentee')
  const [department, setDepartment] = useState(departments[0])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            department,
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

      // Insert profile record
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: userId,
        role,
        full_name: fullName,
        email,
        department,
      })

      if (profileError) {
        setError(profileError.message)
        return
      }

      router.push(roleRedirectMap[role])
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to create account')
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
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Create ERP Account
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Mentor–Mentee Management System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
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
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" required>
                Institutional Email Address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="rohan.sharma@eng.college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Role Selection */}
            <div>
              <Label required>Institutional Role</Label>
              <div className="space-y-1.5 mt-1">
                {roleOptions.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex items-start gap-3 p-2.5 rounded-md border cursor-pointer transition-colors',
                      role === option.value
                        ? 'border-accent bg-blue-50/60 ring-1 ring-accent/30'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={role === option.value}
                      onChange={() => setRole(option.value)}
                      className="mt-0.5 accent-accent shrink-0"
                    />
                    <div>
                      <p
                        className={cn(
                          'text-xs font-semibold',
                          role === option.value ? 'text-accent' : 'text-slate-800'
                        )}
                      >
                        {option.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Department */}
            <div>
              <Label htmlFor="department" required>
                Department
              </Label>
              <Select
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={departments.map((d) => ({ value: d, label: d }))}
              />
            </div>

            {/* Password */}
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
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" required>
                  Confirm
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Error */}
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
              {isLoading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link
              href="/auth/sign-in"
              className="text-accent font-semibold hover:underline"
            >
              Sign in to ERP
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
