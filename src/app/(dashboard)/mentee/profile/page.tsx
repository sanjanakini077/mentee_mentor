'use client'

import React, { useEffect, useState } from 'react'
import {
  User,
  Lock,
  Building,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Heart,
  Users,
  AlertCircle,
  Save,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  getMenteeFullData,
  updateMenteeProfile,
  type MenteeFullData,
} from '@/lib/services/menteeService'

export default function MenteeProfilePage() {
  const { success, error: toastError } = useToast()

  const [data, setData] = useState<MenteeFullData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Form State
  const [fullName, setFullName] = useState('')
  const [usn, setUsn] = useState('')
  const [department, setDepartment] = useState('')
  const [semester, setSemester] = useState('1')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [address, setAddress] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function loadProfile() {
      try {
        const full = await getMenteeFullData()
        if (isMounted) {
          setData(full)
          setFullName(full.profile.full_name || '')
          setUsn(full.studentProfile.usn || '')
          setDepartment(full.studentProfile.department || full.profile.department || '')
          setSemester(String(full.studentProfile.semester || 1))
          setEmail(full.profile.email || '')
          setPhoneNumber(full.profile.phone_number || '')
          setBloodGroup(full.studentProfile.blood_group || '')
          setAddress(full.studentProfile.address || '')
          setParentName(full.studentProfile.parent_name || '')
          setParentPhone(full.studentProfile.parent_phone || '')
        }
      } catch (err: any) {
        if (isMounted) {
          setLoadError(err?.message || 'Failed to load profile record.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()
    return () => {
      isMounted = false
    }
  }, [])

  const validate = () => {
    const errs: Record<string, string> = {}

    if (!fullName.trim()) {
      errs.fullName = 'Full legal name is required.'
    }

    if (!usn.trim()) {
      errs.usn = 'University Seat Number (USN) is required.'
    } else if (usn.trim().length < 6) {
      errs.usn = 'USN must be at least 6 alphanumeric characters.'
    }

    if (phoneNumber && !/^[0-9+ -]{7,15}$/.test(phoneNumber.trim())) {
      errs.phoneNumber = 'Enter a valid telephone/mobile number.'
    }

    if (parentPhone && !/^[0-9+ -]{7,15}$/.test(parentPhone.trim())) {
      errs.parentPhone = 'Enter a valid emergency contact number.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePreSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      setIsConfirmOpen(true)
    }
  }

  const handleSaveConfirmed = async () => {
    if (!data) return
    setIsSaving(true)

    try {
      await updateMenteeProfile({
        profileId: data.profile.id,
        studentProfileId: data.studentProfile.id,
        fullName,
        phoneNumber,
        usn,
        semester: Number(semester),
        bloodGroup,
        address,
        parentName,
        parentPhone,
        currentStatus: data.studentProfile.verification_status,
      })

      success('Student profile records successfully updated and saved in database.')
      setIsConfirmOpen(false)

      // Refresh full data
      const refreshed = await getMenteeFullData()
      setData(refreshed)
    } catch (err: any) {
      toastError(err?.message || 'Failed to save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (loadError || !data) {
    return (
      <div className="p-6 bg-white border border-rose-200 rounded-md space-y-3">
        <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
          <AlertCircle size={18} />
          <span>Error Loading Profile</span>
        </div>
        <p className="text-xs text-slate-600">{loadError || 'Unable to access your student profile.'}</p>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  const status = data.studentProfile.verification_status
  const isLocked = status === 'submitted' || status === 'approved'
  const isUsnLocked = status !== 'draft'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile Management"
        description="Official student demographic and institutional record details."
        breadcrumbs={[
          { label: 'Student Portal', href: '/mentee/dashboard' },
          { label: 'My Profile' },
        ]}
        badge={<StatusBadge status={status} />}
        actions={
          !isLocked ? (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Save size={14} />}
              onClick={handlePreSave}
            >
              Save Profile Changes
            </Button>
          ) : undefined
        }
      />

      {/* Lock Status Explanatory Notices */}
      {status === 'submitted' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 flex items-start gap-3 shadow-xs">
          <Lock size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">
              Profile Locked — Submission Under Review
            </p>
            <p className="text-blue-700 mt-0.5">
              Your profile is currently under review by your assigned faculty mentor and HOD.
              Edits are restricted to prevent data divergence while evaluation is in progress.
            </p>
          </div>
        </div>
      )}

      {status === 'approved' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-start gap-3 shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900">
              Verified Student Record Locked
            </p>
            <p className="text-emerald-700 mt-0.5">
              This record has been officially verified and endorsed by the department.
              Any correction must be requested through your faculty mentor or Department Administrator.
            </p>
          </div>
        </div>
      )}

      {status === 'correction_requested' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 flex items-start gap-3 shadow-xs">
          <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">
              Editing Permitted: Changes Requested
            </p>
            <p className="text-amber-800 mt-0.5">
              {data.studentProfile.review_comment ? (
                <>Reviewer note: &ldquo;{data.studentProfile.review_comment}&rdquo;</>
              ) : (
                'Please update the highlighted information and save your changes.'
              )}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handlePreSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2-Column Form Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Academic & University Identity */}
          <Card
            title="Institutional & Academic Identity"
            description="University enrollment parameters and unique institutional identifiers"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="University Seat Number (USN)"
                htmlFor="usn"
                required
                error={errors.usn}
                description={
                  isUsnLocked
                    ? 'Unique identifier permanently linked to university records.'
                    : 'Enter official University Seat Number (e.g. 1RV21CS001).'
                }
              >
                <div className="relative">
                  <Input
                    id="usn"
                    value={usn}
                    disabled={isUsnLocked || isLocked}
                    onChange={(e) => setUsn(e.target.value.toUpperCase())}
                    placeholder="1RV21CS001"
                    className="font-mono uppercase"
                  />
                  {isUsnLocked && (
                    <div className="absolute right-3 top-2.5 text-slate-400">
                      <Lock size={14} />
                    </div>
                  )}
                </div>
              </FormField>

              <FormField
                label="Department"
                htmlFor="department"
                required
                description="Institutional academic department"
              >
                <div className="relative">
                  <Input
                    id="department"
                    value={department}
                    disabled
                    className="bg-slate-50 text-slate-600"
                  />
                  <div className="absolute right-3 top-2.5 text-slate-400">
                    <Lock size={14} />
                  </div>
                </div>
              </FormField>

              <FormField
                label="Full Legal Name"
                htmlFor="fullName"
                required
                error={errors.fullName}
                description="Student name as registered on matriculation certificate"
              >
                <Input
                  id="fullName"
                  value={fullName}
                  disabled={isLocked}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                />
              </FormField>

              <FormField
                label="Current Enrolled Semester"
                htmlFor="semester"
                required
                description="Active semester standing"
              >
                <Select
                  id="semester"
                  value={semester}
                  disabled={isLocked}
                  onChange={(e) => setSemester(e.target.value)}
                  options={[
                    { value: '1', label: 'Semester 1 (1st Year)' },
                    { value: '2', label: 'Semester 2 (1st Year)' },
                    { value: '3', label: 'Semester 3 (2nd Year)' },
                    { value: '4', label: 'Semester 4 (2nd Year)' },
                    { value: '5', label: 'Semester 5 (3rd Year)' },
                    { value: '6', label: 'Semester 6 (3rd Year)' },
                    { value: '7', label: 'Semester 7 (4th Year)' },
                    { value: '8', label: 'Semester 8 (4th Year)' },
                  ]}
                />
              </FormField>
            </div>
          </Card>

          {/* Section 2: Contact & Personal Details */}
          <Card
            title="Personal & Direct Contact Information"
            description="Official communications and emergency notifications"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Institutional Email"
                htmlFor="email"
                description="University single sign-on address (locked)"
              >
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    leftIcon={<Mail size={15} />}
                    className="font-mono text-xs bg-slate-50 text-slate-600"
                  />
                  <div className="absolute right-3 top-2.5 text-slate-400">
                    <Lock size={14} />
                  </div>
                </div>
              </FormField>

              <FormField
                label="Personal Mobile / WhatsApp"
                htmlFor="phoneNumber"
                error={errors.phoneNumber}
                description="Direct contact number for mentorship updates"
              >
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  disabled={isLocked}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  leftIcon={<Phone size={15} />}
                />
              </FormField>

              <FormField
                label="Blood Group"
                htmlFor="bloodGroup"
                description="Medical records & campus health center"
              >
                <Select
                  id="bloodGroup"
                  value={bloodGroup}
                  disabled={isLocked}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  options={[
                    { value: '', label: 'Select Blood Group' },
                    { value: 'A+', label: 'A+' },
                    { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' },
                    { value: 'B-', label: 'B-' },
                    { value: 'O+', label: 'O+' },
                    { value: 'O-', label: 'O-' },
                    { value: 'AB+', label: 'AB+' },
                    { value: 'AB-', label: 'AB-' },
                  ]}
                />
              </FormField>

              <FormField
                label="Academic Batch"
                htmlFor="batch"
                description="Four-year curriculum cycle"
              >
                <Input
                  id="batch"
                  value={data.studentProfile.academic_batch || '2024-2028'}
                  disabled
                  className="bg-slate-50 text-slate-600"
                />
              </FormField>
            </div>

            <div className="mt-4">
              <FormField
                label="Permanent Residential Address"
                htmlFor="address"
                description="Official home address for formal correspondences"
              >
                <Textarea
                  id="address"
                  rows={2}
                  value={address}
                  disabled={isLocked}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Flat/House No., Area, City, State, PIN code"
                />
              </FormField>
            </div>
          </Card>

          {/* Section 3: Parent / Guardian Emergency Contact */}
          <Card
            title="Parent / Guardian Emergency Contact"
            description="Designated institutional emergency contact"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Parent / Guardian Full Name"
                htmlFor="parentName"
                description="Name of primary guardian"
              >
                <Input
                  id="parentName"
                  value={parentName}
                  disabled={isLocked}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="e.g. Mr. Rajesh Sharma"
                  leftIcon={<Users size={15} />}
                />
              </FormField>

              <FormField
                label="Parent Contact Number"
                htmlFor="parentPhone"
                error={errors.parentPhone}
                description="24/7 emergency telephone number"
              >
                <Input
                  id="parentPhone"
                  type="tel"
                  value={parentPhone}
                  disabled={isLocked}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  leftIcon={<Phone size={15} />}
                />
              </FormField>
            </div>
          </Card>
        </div>

        {/* Right Column: Status & Policy Information */}
        <div className="space-y-6">
          <Card title="Record Policy & Verification">
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                <span className="font-semibold text-slate-800 block">
                  Identity Protection Guidelines:
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Institutional regulations require University Seat Numbers (USN) and academic
                  departments to remain immutable once confirmed.
                </p>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Students may edit contact information and address whenever required in draft mode.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Current Status:</span>
                  <StatusBadge status={status} />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Last Database Sync:</span>
                  <span className="font-mono text-slate-700">
                    {data.studentProfile.updated_at
                      ? new Date(data.studentProfile.updated_at).toLocaleDateString()
                      : 'Initial'}
                  </span>
                </div>
              </div>

              {!isLocked ? (
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full mt-4"
                  isLoading={isSaving}
                >
                  Save Profile Record
                </Button>
              ) : (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded text-center text-slate-500 text-[11px]">
                  Record is locked under current verification status ({status}).
                </div>
              )}
            </div>
          </Card>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm Profile Updates"
        message="Are you sure you want to persist these demographic and contact updates to your official student profile record?"
        confirmText="Confirm & Save"
        cancelText="Keep Reviewing"
        isLoading={isSaving}
        onConfirm={handleSaveConfirmed}
        onClose={() => setIsConfirmOpen(false)}
      />
    </div>
  )
}
