'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap,
  Mail,
  Lock,
  UserCheck,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { loginDemoUser } from '@/lib/storage/demoStore'

type ActivePortalRole = 'student' | 'faculty' | 'hod'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectToParam = searchParams.get('redirectTo')

  const [selectedRole, setSelectedRole] = useState<ActivePortalRole>('student')
  const [email, setEmail] = useState('student@demo.com')
  const [password, setPassword] = useState('demo123')
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleTabChange = (role: ActivePortalRole) => {
    setSelectedRole(role)
    if (role === 'student') setEmail('student@demo.com')
    else if (role === 'faculty') setEmail('mentor@demo.com')
    else setEmail('hod@demo.com')
  }

  const performLogin = (roleOrEmail: string) => {
    setIsLoading(true)
    const user = loginDemoUser(roleOrEmail)

    // Check safe redirect
    if (
      redirectToParam &&
      redirectToParam.startsWith('/') &&
      !redirectToParam.startsWith('//')
    ) {
      router.push(redirectToParam)
      return
    }

    if (user.role === 'mentor') {
      router.push('/mentor/dashboard')
    } else if (user.role === 'administrator' || (user.role as string) === 'hod') {
      router.push('/admin/dashboard')
    } else {
      router.push('/mentee/dashboard')
    }
  }

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    performLogin(email || selectedRole)
  }

  const roleMeta = {
    student: {
      title: 'Student Portal Sign-In',
      buttonText: 'Sign In as Student',
      email: 'student@demo.com',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    faculty: {
      title: 'Faculty Mentor Portal Sign-In',
      buttonText: 'Sign In as Faculty Mentor',
      email: 'mentor@demo.com',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    hod: {
      title: 'Department HOD Sign-In',
      buttonText: 'Sign In as Department HOD',
      email: 'hod@demo.com',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  }

  return (
    <div className="w-full max-w-md">
      {/* Branding Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-sm mb-4">
          <GraduationCap size={24} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Mentor–Mentee Management System
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Institutional ERP Portal • Academic Session 2024–2025
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 sm:p-8 space-y-6">
        {/* Role Segmented Controller */}
        <div>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleRoleTabChange('student')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md transition-all ${
                selectedRole === 'student'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap size={14} />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange('faculty')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md transition-all ${
                selectedRole === 'faculty'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck size={14} />
              <span>Faculty</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange('hod')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md transition-all ${
                selectedRole === 'hod'
                  ? 'bg-white text-purple-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck size={14} />
              <span>HOD</span>
            </button>
          </div>
          <div className="mt-2 text-center">
            <span className="text-[11px] font-medium text-slate-500">
              Active Role:{' '}
              <span className="font-semibold text-slate-800">
                {roleMeta[selectedRole].title}
              </span>
            </span>
          </div>
        </div>

        {/* Demo Mode Notice */}
        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-start gap-2">
          <Zap size={14} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Local Demo Mode:</span> Runs completely in browser storage. Click any role or button below to enter directly.
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <Label htmlFor="email" required>
              Institutional Email Address
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
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="password" required>
                Password
              </Label>
              <span className="text-[11px] text-slate-400 font-mono">
                demo123
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9 font-mono"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
            isLoading={isLoading}
          >
            {roleMeta[selectedRole].buttonText}
          </Button>
        </form>

        {/* Quick Instant Demo Access Buttons */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
            Instant 1-Click Demo Portals
          </p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => performLogin('student')}
              className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <GraduationCap size={15} className="text-blue-600" />
                <span>Enter as <strong>Student</strong> (Gaurav B. Shet)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">student@demo.com</span>
            </button>

            <button
              type="button"
              onClick={() => performLogin('mentor')}
              className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <UserCheck size={15} className="text-emerald-600" />
                <span>Enter as <strong>Faculty Mentor</strong> (Dr. K. S. Venkatesh)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">mentor@demo.com</span>
            </button>

            <button
              type="button"
              onClick={() => performLogin('hod')}
              className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-purple-600" />
                <span>Enter as <strong>Department HOD</strong> (Dr. Balasubramani R)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">hod@demo.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Suspense
        fallback={
          <div className="text-xs text-slate-400">Loading Sign-In Portal...</div>
        }
      >
        <SignInForm />
      </Suspense>
    </div>
  )
}
