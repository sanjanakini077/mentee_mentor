'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Lock, CheckCircle2 } from 'lucide-react'
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsSuccess(true)
      setTimeout(() => {
        router.push('/auth/sign-in')
      }, 1500)
    }, 400)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-slate-200 rounded-md shadow-sm p-7">
          <div className="flex flex-col items-center mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white mb-3">
              <GraduationCap size={20} />
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Set New Password
            </h1>
            <p className="text-xs text-slate-500 mt-1 text-center">
              Enter your new institutional password.
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Password updated successfully!
              </p>
              <p className="text-xs text-slate-500">Redirecting to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="password" required>
                  New Password
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
                  Confirm Password
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

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 text-xs"
                isLoading={isLoading}
              >
                Update Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
