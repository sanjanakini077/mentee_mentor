'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Lock, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setIsSuccess(true)

      // Fetch user profile to redirect to proper role dashboard
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        const role = profile?.role ? String(profile.role).toLowerCase() : 'mentee'
        const target =
          role === 'administrator' || role === 'hod'
            ? '/admin/dashboard'
            : role === 'mentor'
            ? '/mentor/dashboard'
            : '/mentee/dashboard'

        setTimeout(() => {
          router.push(target)
          router.refresh()
        }, 1500)
      } else {
        setTimeout(() => {
          router.push('/auth/sign-in')
          router.refresh()
        }, 1500)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-slate-200 rounded-md shadow-sm p-7">
          {/* Institution Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center mb-3 text-white shadow-xs">
              <GraduationCap size={24} />
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight text-center">
              Set New Password
            </h1>
            <p className="text-xs text-slate-500 text-center mt-0.5">
              Mentor–Mentee Management System
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Password Updated
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your credentials have been securely updated. Redirecting to your
                  portal...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <Label htmlFor="password" required>
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock size={15} />}
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" required>
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock size={15} />}
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
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
                Update Password & Sign In
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

