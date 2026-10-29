'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  UserPlus,
  Mail,
  Phone,
  Building,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  BadgeAlert,
  GraduationCap,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormField } from '@/components/ui/FormField'
import { registerFacultyMentorAction } from '@/lib/actions/authActions'

export default function RegisterFacultyPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [department, setDepartment] = useState('Information Science & Engineering')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<{
    name: string
    email: string
    employeeId: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !password) {
      setErrorMessage('Please fill in all required fields.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await registerFacultyMentorAction({
        fullName,
        email,
        employeeId: employeeId.trim() || undefined,
        department,
        phoneNumber,
        password,
        confirmPassword,
      })

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to register faculty mentor.')
      } else {
        setSuccessInfo({
          name: fullName,
          email,
          employeeId: employeeId.trim() || 'N/A',
        })
        // Reset form
        setFullName('')
        setEmail('')
        setEmployeeId('')
        setPhoneNumber('')
        setPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'A network or system error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Register Faculty Mentor"
        description="Provision a new faculty mentor account under Department Administration. Role is strictly assigned as Mentor."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Faculty Directory', href: '/admin/faculty' },
          { label: 'Register Faculty' },
        ]}
        actions={
          <Link href="/admin/faculty">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Faculty Roster
            </Button>
          </Link>
        }
      />

      {successInfo && (
        <Card className="p-6 bg-emerald-50 border border-emerald-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-emerald-900 text-base">
                Faculty Mentor Registered Successfully
              </h3>
              <p className="text-sm text-emerald-800">
                <strong>{successInfo.name}</strong> has been registered with email{' '}
                <strong>{successInfo.email}</strong>
                {successInfo.employeeId !== 'N/A' && (
                  <> (Employee ID: <strong>{successInfo.employeeId}</strong>)</>
                )}
                . The mentor can now sign in using their institutional credentials.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <Button
                  size="sm"
                  onClick={() => setSuccessInfo(null)}
                  variant="outline"
                  className="bg-white hover:bg-emerald-100 border-emerald-300 text-emerald-900"
                >
                  Register Another Mentor
                </Button>
                <Link href="/admin/faculty">
                  <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white">
                    View in Faculty Directory
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {errorMessage && (
        <Card className="p-4 bg-rose-50 border border-rose-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <p className="text-sm font-medium text-rose-800">{errorMessage}</p>
          </div>
        </Card>
      )}

      <Card className="p-6 border border-slate-200">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">
            Faculty Information & Credentials
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Full Name" required>
              <Input
                placeholder="e.g. Dr. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </FormField>

            <FormField label="Employee ID">
              <Input
                placeholder="e.g. EMP-ISE-042"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={isSubmitting}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Institutional Email" required>
              <Input
                type="email"
                placeholder="e.g. ramesh.ise@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </FormField>

            <FormField label="Contact Phone Number" required>
              <Input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </FormField>
          </div>

          <FormField label="Department" required>
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </FormField>

          <div className="pt-2 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Initial Password" required description="At least 6 characters">
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </FormField>

              <FormField label="Confirm Password" required>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </FormField>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Link href="/admin/faculty">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? 'Registering...' : 'Register Faculty Mentor'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
