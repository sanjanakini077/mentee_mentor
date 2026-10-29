'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsSuccess(true)
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
              Reset ERP Access
            </h1>
            <p className="text-xs text-slate-500 mt-1 text-center">
              Enter your email address to receive password reset instructions.
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Demo instructions dispatched
              </p>
              <p className="text-xs text-slate-500">
                In demo mode, you can log in directly using the demo accounts on the sign-in page.
              </p>
              <Link
                href="/auth/sign-in"
                className="inline-block text-xs font-semibold text-blue-600 hover:underline pt-2"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="student@demo.com"
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 text-xs"
                isLoading={isLoading}
              >
                Send Instructions
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/auth/sign-in"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
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
