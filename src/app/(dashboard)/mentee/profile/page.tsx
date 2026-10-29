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
  FileText,
  Upload,
  Download,
  Trash2,
  Paperclip,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  getMenteeFullData,
  updateMenteeProfile,
  type MenteeFullData,
} from '@/lib/services/menteeService'
import type { StudentDocument, DocumentType } from '@/types'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const docTypeLabels: Record<DocumentType, { label: string; color: string }> = {
  marks_card: { label: 'Marks Card', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  transcript: { label: 'Transcript', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  certificate: { label: 'Certificate', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  other: { label: 'Document', color: 'bg-slate-50 text-slate-700 border-slate-200' },
}

export default function MenteeProfilePage() {
  const { success, error: toastError } = useToast()

  const [activeTab, setActiveTab] = useState<'profile' | 'documents'>('profile')
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

  // Document Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [docTitle, setDocTitle] = useState('')
  const [docType, setDocType] = useState<DocumentType>('marks_card')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Document Deletion State
  const [docToDelete, setDocToDelete] = useState<StudentDocument | null>(null)
  const [isDeletingDoc, setIsDeletingDoc] = useState(false)

  const reloadData = async () => {
    const full = await getMenteeFullData()
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
    } else if (usn.trim().length < 5) {
      errs.usn = 'USN must be at least 5 alphanumeric characters.'
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
        fullName,
        phoneNumber,
        usn,
        department,
        semester: Number(semester),
        bloodGroup,
        address,
        parentName,
        parentPhone,
      })

      success('Student profile records successfully updated and saved in database.')
      setIsConfirmOpen(false)

      await reloadData()
    } catch (err: any) {
      toastError(err?.message || 'Failed to save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadError(null)

    if (!uploadFile) {
      setUploadError('Please choose a file to upload.')
      return
    }

    if (!docTitle.trim()) {
      setUploadError('Please provide a descriptive document title.')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('title', docTitle.trim())
      formData.append('documentType', docType)

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to upload document.')
      }

      success('Academic document uploaded successfully.')
      setUploadFile(null)
      setDocTitle('')
      // Reset input element
      const fileInput = document.getElementById('academic-doc-file') as HTMLInputElement | null
      if (fileInput) fileInput.value = ''

      await reloadData()
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload document.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteDocument = async () => {
    if (!docToDelete) return
    setIsDeletingDoc(true)

    try {
      const res = await fetch(`/api/documents/${docToDelete.id}`, {
        method: 'DELETE',
      })
      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete document.')
      }

      success('Document removed successfully.')
      setDocToDelete(null)
      await reloadData()
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete document.')
    } finally {
      setIsDeletingDoc(false)
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
  const documents = data.documents || []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile Management"
        description="Official student demographic records, academic information, and uploaded certificates."
        breadcrumbs={[
          { label: 'Student Portal', href: '/mentee/dashboard' },
          { label: 'My Profile' },
        ]}
        badge={<StatusBadge status={status} />}
        actions={
          activeTab === 'profile' ? (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Save size={14} />}
              onClick={handlePreSave}
              isLoading={isSaving}
            >
              Save Profile Changes
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <User size={16} />
            <span>Profile Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'documents'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Paperclip size={16} />
            <span>Academic Documents</span>
            <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
              {documents.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'profile' && (
        <>
          {/* Status Notices */}
          {status === 'submitted' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 flex items-start gap-3 shadow-xs">
              <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">
                  Verification Submission Under Review
                </p>
                <p className="text-blue-700 mt-0.5">
                  Your profile details are currently pending endorsement by your mentor. You can update your phone, address, and demographic details below whenever necessary.
                </p>
              </div>
            </div>
          )}

          {status === 'approved' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-start gap-3 shadow-xs">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">
                  Verified Student Record
                </p>
                <p className="text-emerald-700 mt-0.5">
                  Your student record is verified. Any updates to your contact information or personal details will be saved directly into the institution database.
                </p>
              </div>
            </div>
          )}

          {status === 'correction_requested' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 flex items-start gap-3 shadow-xs">
              <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">
                  Reviewer Requested Changes
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
                    description="Official University Seat Number (e.g. 1RV21CS001)"
                  >
                    <Input
                      id="usn"
                      value={usn}
                      onChange={(e) => setUsn(e.target.value.toUpperCase())}
                      placeholder="1RV21CS001"
                      className="font-mono uppercase"
                    />
                  </FormField>

                  <FormField
                    label="Department"
                    htmlFor="department"
                    required
                    description="Academic department"
                  >
                    <Input
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Information Science & Engineering"
                    />
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
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Sanjana Kini"
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
                    description="University account sign-in address"
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
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="e.g. Mr. Rajesh Kini"
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
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="+91 98450 12345"
                      leftIcon={<Phone size={15} />}
                    />
                  </FormField>
                </div>
              </Card>
            </div>

            {/* Right Column: Status & Save Action */}
            <div className="space-y-6">
              <Card title="Record Policy & Verification">
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                    <span className="font-semibold text-slate-800 block">
                      Profile Persistence:
                    </span>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Changes saved here update your permanent profile in the SQLite database immediately and persist across sessions.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Current Status:</span>
                      <StatusBadge status={status} />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Completion:</span>
                      <span className="font-semibold text-slate-700">{data.completionRate}%</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full mt-4"
                    isLoading={isSaving}
                  >
                    Save Profile Changes
                  </Button>
                </div>
              </Card>
            </div>
          </form>
        </>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Upload Form Card */}
          <Card
            title="Upload Academic Document"
            description="Upload official marks cards, transcripts, or academic certificates (PDF, JPG, PNG up to 5 MB)."
          >
            {uploadError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Document Title / Label" required>
                  <Input
                    placeholder="e.g. Semester 3 Marks Card"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    disabled={isUploading}
                    required
                  />
                </FormField>

                <FormField label="Document Type" required>
                  <Select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DocumentType)}
                    disabled={isUploading}
                    options={[
                      { value: 'marks_card', label: 'Marks Card / Grade Sheet' },
                      { value: 'transcript', label: 'Academic Transcript' },
                      { value: 'certificate', label: 'Certificate / Achievement' },
                      { value: 'other', label: 'Other Academic Document' },
                    ]}
                  />
                </FormField>

                <FormField label="Select File (PDF, JPG, PNG)" required description="Max 5 MB">
                  <input
                    id="academic-doc-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    disabled={isUploading}
                    className="block w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-300 rounded-md p-1 bg-white"
                    required
                  />
                </FormField>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-2"
                  isLoading={isUploading}
                  disabled={isUploading}
                >
                  <Upload size={14} />
                  <span>Upload Document</span>
                </Button>
              </div>
            </form>
          </Card>

          {/* Uploaded Documents List */}
          <Card
            title={`Uploaded Academic Documents (${documents.length})`}
            description="All academic files submitted and persisted on local server storage."
          >
            {documents.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-md">
                <FileText className="mx-auto h-10 w-10 text-slate-300" />
                <h4 className="mt-2 text-sm font-semibold text-slate-700">No documents uploaded yet</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Select and upload your marks sheets or certificates using the form above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Document Title</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Filename</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Uploaded On</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {documents.map((doc) => {
                      const badgeInfo =
                        docTypeLabels[doc.document_type as DocumentType] || docTypeLabels.other
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {doc.title}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded border text-[11px] font-medium ${badgeInfo.color}`}
                            >
                              {badgeInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                            {doc.original_filename}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                            {formatFileSize(doc.file_size)}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <a
                              href={`/api/documents/${doc.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                            >
                              <ExternalLink size={12} />
                              <span>View</span>
                            </a>
                            <a
                              href={`/api/documents/${doc.id}?download=true`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200"
                            >
                              <Download size={12} />
                              <span>Download</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => setDocToDelete(doc)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Profile Update Confirmation Dialog */}
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

      {/* Document Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!docToDelete}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${docToDelete?.title || 'this document'}" (${docToDelete?.original_filename})? Both the file on disk and its database record will be removed.`}
        confirmText="Delete Document"
        cancelText="Cancel"
        isLoading={isDeletingDoc}
        onConfirm={handleDeleteDocument}
        onClose={() => setDocToDelete(null)}
      />
    </div>
  )
}
