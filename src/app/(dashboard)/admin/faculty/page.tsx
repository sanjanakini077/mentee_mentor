'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  GraduationCap,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormField } from '@/components/ui/FormField'
import { Dialog } from '@/components/ui/Dialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  getDepartmentFacultyList,
  provisionFacultyMentor,
  type FacultyMemberItem,
} from '@/lib/services/adminService'
import { formatDateTime } from '@/lib/utils'

export default function FacultyDirectoryPage() {
  const { success, error: toastError } = useToast()

  const [department, setDepartment] = useState('')
  const [faculty, setFaculty] = useState<FacultyMemberItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Add Faculty Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('Faculty@2024!')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const res = await getDepartmentFacultyList()
      setDepartment(res.department)
      setFaculty(res.faculty)
    } catch (err: any) {
      toastError(err?.message || 'Failed to load faculty roster.')
    } finally {
      setIsLoading(false)
    }
  }, [toastError])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtered Faculty
  const filteredFaculty = useMemo(() => {
    if (!searchQuery.trim()) return faculty
    const q = searchQuery.toLowerCase().trim()
    return faculty.filter(
      (f) =>
        f.fullName.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        (f.phone && f.phone.includes(q))
    )
  }, [faculty, searchQuery])

  // Metrics
  const totalFaculty = faculty.length
  const totalAssignedMentees = faculty.reduce((acc, curr) => acc + curr.activeMenteeCount, 0)
  const avgMentees = totalFaculty > 0 ? (totalAssignedMentees / totalFaculty).toFixed(1) : '0'

  const handleOpenModal = () => {
    setFullName('')
    setEmail('')
    setPhone('')
    setPassword('Faculty@2024!')
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!fullName.trim()) {
      setFormError('Please enter the faculty member’s full name.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid institutional email address.')
      return
    }
    if (!password || password.length < 6) {
      setFormError('Password must contain at least 6 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await provisionFacultyMentor({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
      })

      success(res.message)
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      setFormError(err?.message || 'Could not provision faculty account.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Directory"
        description={`Department of ${department} — Faculty mentor roster and account management`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Faculty Members' },
        ]}
        actions={
          <Button onClick={handleOpenModal} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Faculty Mentor
          </Button>
        }
      />

      {/* Metric Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-md">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Faculty
              </p>
              <p className="text-2xl font-bold text-slate-900">{totalFaculty}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Mentored Students
              </p>
              <p className="text-2xl font-bold text-slate-900">{totalAssignedMentees}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-md">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Avg. Mentees / Faculty
              </p>
              <p className="text-2xl font-bold text-slate-900">{avgMentees}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="p-4 border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty by name or email..."
              className="pl-9"
            />
          </div>
          <span className="text-xs text-slate-500">
            Showing {filteredFaculty.length} of {totalFaculty} faculty members
          </span>
        </div>
      </Card>

      {/* Faculty Table */}
      <Card className="border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Faculty Name</th>
                <th className="px-4 py-3">Institutional Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Active Mentees</th>
                <th className="px-4 py-3">Date Added</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">No faculty members found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try clearing the search filter.'
                        : 'Click "+ Add Faculty Mentor" above to provision your first faculty account.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredFaculty.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-semibold">
                          {item.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{item.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{item.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not provided</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={item.activeMenteeCount > 0 ? 'info' : 'default'}>
                        {item.activeMenteeCount} {item.activeMenteeCount === 1 ? 'student' : 'students'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/assignments?mentorId=${item.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        Allocate Mentees
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Faculty Mentor Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision Faculty Mentor Account"
        description={`Add a new faculty member to the Department of ${department}.`}
      >
        <form onSubmit={handleCreateFaculty} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <FormField label="Full Name" required>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Prof. Ananya Sharma"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label="Institutional Email" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ananya.sharma@college.edu"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Initial Password"
            required
            description="The faculty member can change their password anytime via Forgot Password."
          >
            <div className="relative">
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="font-mono text-sm"
              />
              <KeyRound className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </FormField>

          <FormField label="Phone Number">
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98450 12345"
              disabled={isSubmitting}
            />
          </FormField>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Institutional Policy</span>
            </div>
            <p>
              This account will automatically be assigned the <strong>mentor</strong> role under{' '}
              <strong>{department}</strong> with access to the Mentor Portal.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Faculty Account
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
