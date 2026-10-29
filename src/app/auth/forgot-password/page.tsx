'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const origin = window.location.origin
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
        }
      )

      if (resetError) {
        setError(resetError.message)
        return
      }

      setIsSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to send recovery instructions.')
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
              Account Recovery
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
                  Password Reset Link Sent
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  We have dispatched a password recovery link to{' '}
                  <strong className="text-slate-700 font-mono">{email}</strong>.
                  Please check your inbox.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/auth/sign-in">
                  <Button variant="outline" size="sm" className="w-full">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your institutional email address. We will verify your account
                and send an authorized password reset link.
              </p>

              <div>
                <Label htmlFor="email" required>
                  Institutional Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="username@eng.college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail size={15} />}
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
                Send Password Reset Link
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/auth/sign-in"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

