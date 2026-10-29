'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  BookOpen,
  FileText,
  ThumbsUp,
  History,
  ArrowLeft,
  Calendar,
  Lock,
  Eye,
  Plus,
  Mail,
  Phone,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Edit2,
  Trash2,
  MapPin,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  getAssignedStudentDetail,
  createMentorNote,
  updateMentorNote,
  deleteMentorNote,
  createMentorRecommendation,
  type StudentFullDetail,
} from '@/lib/services/mentorService'
import { formatDate } from '@/lib/utils'
import type { AcademicRecord, MentorNote, MentorRecommendation, NoteVisibility, RecommendationCategory } from '@/types'

export default function MentorStudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string

  const { success, error: toastError } = useToast()

  const [detail, setDetail] = useState<StudentFullDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accessError, setAccessError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<
    'profile' | 'academics' | 'notes' | 'recommendations' | 'history'
  >('profile')

  // Note Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<MentorNote | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0])
  const [noteVisibility, setNoteVisibility] = useState<NoteVisibility>('shared_with_mentee')
  const [isSavingNote, setIsSavingNote] = useState(false)

  // Recommendation Modal State
  const [isRecModalOpen, setIsRecModalOpen] = useState(false)
  const [recCategory, setRecCategory] = useState<RecommendationCategory>('internship')
  const [recDetails, setRecDetails] = useState('')
  const [isSavingRec, setIsSavingRec] = useState(false)

  // Note Delete State
  const [noteToDelete, setNoteToDelete] = useState<MentorNote | null>(null)

    const loadData = useCallback(async () => {
      try {
        const data = await getAssignedStudentDetail(studentId)
        setDetail(data)
      } catch (err: any) {
        setAccessError(err?.message || 'Access denied.')
      } finally {
        setIsLoading(false)
      }
  }, [studentId])

    useEffect(() => {
      loadData()
}, [loadData])

// Save Note Handler
const handleSaveNote = async () => {
  if (!noteContent.trim() || !detail) return
  setIsSavingNote(true)

  try {
    if (editingNote) {
      await updateMentorNote({
        noteId: editingNote.id,
        content: noteContent,
        noteDate,
        visibility: noteVisibility,
      })
      success('Mentoring note updated.')
    } else {
      await createMentorNote({
        studentProfileId: detail.studentProfile.id,
        content: noteContent,
        noteDate,
        visibility: noteVisibility,
      })
      success('New mentoring note added to student dossier.')
    }
    setIsNoteModalOpen(false)
    await loadData()
  } catch (err: any) {
    toastError(err?.message || 'Failed to save note.')
  } finally {
    setIsSavingNote(false)
  }
}

// Delete Note Handler
const handleDeleteNote = async () => {
  if (!noteToDelete) return
  try {
    await deleteMentorNote(noteToDelete.id)
    success('Note deleted.')
    setNoteToDelete(null)
    await loadData()
  } catch (err: any) {
    toastError(err?.message || 'Failed to delete note.')
  }
}

// Submit Recommendation Handler
const handleSaveRecommendation = async () => {
  if (!recDetails.trim() || !detail) return
  setIsSavingRec(true)

  try {
    await createMentorRecommendation({
      studentProfileId: detail.studentProfile.id,
      category: recCategory,
      details: recDetails,
    })
    success('Recommendation forwarded to HOD for official review.')
    setIsRecModalOpen(false)
    setRecDetails('')
    await loadData()
  } catch (err: any) {
    toastError(err?.message || 'Failed to submit recommendation.')
  } finally {
    setIsSavingRec(false)
  }
}

if (isLoading) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

// Access Control Violation Check
if (accessError || !detail) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-rose-200 rounded-md p-6 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert size={24} />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
            Access Restricted
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-2">
            Unauthorized Student Record Access
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {accessError ||
              'This student record is not allocated to your mentorship desk. Faculty mentors may only access information for their officially assigned students.'}
          </p>
        </div>
        <div className="pt-2">
          <Link href="/mentor/students">
            <Button size="sm" variant="primary" leftIcon={<ArrowLeft size={14} />}>
              Return to Assigned Students
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

const { studentProfile, profile, academicRecords, mentorNotes, recommendations, assignmentDate } = detail

// Academic Columns Definition
const academicColumns: ColumnDef<AcademicRecord>[] = [
  {
    key: 'semester',
    header: 'Sem',
    sortable: true,
    cell: (row) => (
      <span className="font-semibold text-slate-900 font-mono text-xs">
        S{row.semester}
      </span>
    ),
  },
  {
    key: 'course_code',
    header: 'Course Code',
    sortable: true,
    cell: (row) => (
      <span className="font-mono font-bold text-slate-900 text-xs">
        {row.course_code}
      </span>
    ),
  },
  {
    key: 'course_name',
    header: 'Subject Title',
    sortable: true,
    cell: (row) => (
      <div>
        <p className="font-semibold text-slate-900 text-xs">{row.course_name}</p>
        <span className="text-[11px] text-slate-400 font-mono">
          {row.academic_year} • {row.credits} Credits
        </span>
      </div>
    ),
  },
  {
    key: 'marks_obtained',
    header: 'Marks / Grade',
    sortable: true,
    align: 'right',
    cell: (row) => (
      <div className="text-right">
        <span className="font-bold text-slate-900 text-xs">
          {row.grade ? `Grade ${row.grade}` : `${row.marks_obtained || 0} / ${row.max_marks || 100}`}
        </span>
        {row.grade_points !== null && row.grade_points !== undefined && (
          <span className="block text-[10px] text-slate-500 font-mono">
            GP: {row.grade_points}
          </span>
        )}
      </div>
    ),
  },
  {
    key: 'attendance_percentage',
    header: 'Attendance',
    sortable: true,
    align: 'right',
    cell: (row) => {
      const att = row.attendance_percentage
      if (att === null || att === undefined) return <span className="text-slate-400">—</span>
      return (
        <span
          className={`font-mono text-xs font-semibold ${att < 75 ? 'text-rose-600' : 'text-slate-700'
            }`}
        >
          {att}%
        </span>
      )
    },
  },
  {
    key: 'is_backlog',
    header: 'Standing',
    cell: (row) => (
      <span
        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${row.is_backlog
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
      >
        {row.is_backlog ? 'Backlog' : 'Cleared'}
      </span>
    ),
  },
]

return (
  <div className="space-y-6">
    {/* Top Header */}
    <PageHeader
      title={`${profile.full_name} (${studentProfile.usn})`}
      description={`Semester ${studentProfile.semester} • ${studentProfile.department} • Batch ${studentProfile.academic_batch}`}
      breadcrumbs={[
        { label: 'Faculty Portal', href: '/mentor/dashboard' },
        { label: 'Assigned Students', href: '/mentor/students' },
        { label: studentProfile.usn },
      ]}
      badge={<StatusBadge status={studentProfile.verification_status} />}
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<FileText size={14} />}
            onClick={() => {
              setEditingNote(null)
              setNoteContent('')
              setNoteDate(new Date().toISOString().split('T')[0])
              setNoteVisibility('shared_with_mentee')
              setIsNoteModalOpen(true)
            }}
          >
            Add Mentoring Note
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<ThumbsUp size={14} />}
            onClick={() => {
              setRecCategory('internship')
              setRecDetails('')
              setIsRecModalOpen(true)
            }}
          >
            Submit Recommendation
          </Button>
        </div>
      }
    />

    {/* Tabs Navigation */}
    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
      <button
        onClick={() => setActiveTab('profile')}
        className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded transition-colors shrink-0 ${activeTab === 'profile'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100'
          }`}
      >
        <User size={14} /> Personal & Academic Profile
      </button>
      <button
        onClick={() => setActiveTab('academics')}
        className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded transition-colors shrink-0 ${activeTab === 'academics'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100'
          }`}
      >
        <BookOpen size={14} /> Academic Records ({academicRecords.length})
      </button>
      <button
        onClick={() => setActiveTab('notes')}
        className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded transition-colors shrink-0 ${activeTab === 'notes'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100'
          }`}
      >
        <FileText size={14} /> Mentoring Notes ({mentorNotes.length})
      </button>
      <button
        onClick={() => setActiveTab('recommendations')}
        className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded transition-colors shrink-0 ${activeTab === 'recommendations'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100'
          }`}
      >
        <ThumbsUp size={14} /> Recommendations ({recommendations.length})
      </button>
      <button
        onClick={() => setActiveTab('history')}
        className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded transition-colors shrink-0 ${activeTab === 'history'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100'
          }`}
      >
        <History size={14} /> Verification & Audit History
      </button>
    </div>

    {/* Tab 1: Personal & Academic Profile */}
    {activeTab === 'profile' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Institutional Demographic Record">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-slate-400">Full Legal Name</dt>
                <dd className="font-semibold text-slate-800 text-sm mt-0.5">
                  {profile.full_name}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">University Seat Number (USN)</dt>
                <dd className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                  {studentProfile.usn}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Department</dt>
                <dd className="font-semibold text-slate-800 mt-0.5">
                  {studentProfile.department}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Current Semester & Batch</dt>
                <dd className="font-semibold text-slate-800 mt-0.5">
                  Semester {studentProfile.semester} • Batch {studentProfile.academic_batch}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Institutional Email</dt>
                <dd className="font-mono text-slate-800 mt-0.5">
                  <a href={`mailto:${profile.email}`} className="text-accent hover:underline">
                    {profile.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Student Phone Number</dt>
                <dd className="font-mono text-slate-800 mt-0.5">
                  {profile.phone_number || 'Not provided'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Blood Group</dt>
                <dd className="font-semibold text-slate-800 mt-0.5">
                  {studentProfile.blood_group || 'Not recorded'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Permanent Address</dt>
                <dd className="text-slate-800 mt-0.5">
                  {studentProfile.address || 'Not on file'}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Emergency Contact & Parent Details">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-slate-400">Parent / Guardian Name</dt>
                <dd className="font-semibold text-slate-800 text-sm mt-0.5">
                  {studentProfile.parent_name || 'Not provided'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Parent Emergency Contact Phone</dt>
                <dd className="font-mono text-slate-800 mt-0.5">
                  {studentProfile.parent_phone ? (
                    <a href={`tel:${studentProfile.parent_phone}`} className="text-accent hover:underline">
                      {studentProfile.parent_phone}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Mentorship Desk Status">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mentorship Status:</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                  Active Allocation
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Allocation Date:</span>
                <span className="font-mono text-slate-700">
                  {assignmentDate ? formatDate(assignmentDate) : 'Session start'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Verification Status:</span>
                <StatusBadge status={studentProfile.verification_status} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    )}

    {/* Tab 2: Academic Records and Progress */}
    {activeTab === 'academics' && (
      <div className="space-y-4">
        <DataTable
          columns={academicColumns as any}
          data={academicRecords as any}
          defaultSortKey="semester"
          defaultSortDirection="asc"
          pageSize={10}
          emptyTitle="No academic records submitted"
          emptyDescription="The student has not yet entered examination records for this academic session."
        />
      </div>
    )}

    {/* Tab 3: Mentoring Notes */}
    {activeTab === 'notes' && (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Mentoring Session History ({mentorNotes.length})
          </h3>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={14} />}
            onClick={() => {
              setEditingNote(null)
              setNoteContent('')
              setNoteDate(new Date().toISOString().split('T')[0])
              setNoteVisibility('shared_with_mentee')
              setIsNoteModalOpen(true)
            }}
          >
            Add Session Note
          </Button>
        </div>

        {mentorNotes.length === 0 ? (
          <div className="p-12 bg-white border border-slate-200 rounded-md text-center text-xs text-slate-500 space-y-1">
            <p>No mentoring session notes logged for this student yet.</p>
            <p className="text-slate-400">Click &ldquo;Add Session Note&rdquo; above to log academic or counseling guidance.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mentorNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-white border border-slate-200 rounded-md shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5 font-mono">
                      <Calendar size={13} className="text-slate-400" />
                      {formatDate(note.note_date)}
                    </span>
                    {note.visibility === 'shared_with_mentee' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-medium">
                        <Eye size={10} /> Visible to Student
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
                        <Lock size={10} /> Private Faculty Note
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingNote(note)
                        setNoteContent(note.content)
                        setNoteDate(note.note_date)
                        setNoteVisibility(note.visibility || 'shared_with_mentee')
                        setIsNoteModalOpen(true)
                      }}
                      className="h-7 w-7 p-0 text-slate-600 hover:text-accent"
                    >
                      <Edit2 size={13} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setNoteToDelete(note)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {/* Tab 4: Recommendations */}
    {activeTab === 'recommendations' && (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Department Recommendations & Endorsements ({recommendations.length})
          </h3>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={14} />}
            onClick={() => {
              setRecCategory('internship')
              setRecDetails('')
              setIsRecModalOpen(true)
            }}
          >
            New Recommendation
          </Button>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-12 bg-white border border-slate-200 rounded-md text-center text-xs text-slate-500 space-y-1">
            <p>No faculty recommendations submitted for this student yet.</p>
            <p className="text-slate-400">
              Submit formal recommendations to the HOD for scholarships, internships, or remedial tracks.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 bg-white border border-slate-200 rounded-md shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-semibold text-xs text-slate-900 capitalize">
                      {rec.category ? rec.category.replace('_', ' ') : 'General'} Endorsement
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Submitted: {formatDate(rec.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={rec.status} />
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {rec.details || rec.content}
                </p>

                {rec.review_comment && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                    <span className="font-bold text-[11px] text-slate-800 block">
                      HOD Official Decision Comment:
                    </span>
                    <p className="italic text-slate-700">&ldquo;{rec.review_comment}&rdquo;</p>
                    {rec.reviewed_at && (
                      <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                        Decided on {formatDate(rec.reviewed_at)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {/* Tab 5: Verification & Audit History */}
    {activeTab === 'history' && (
      <Card title="Institutional Verification Audit Trail">
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Current Verification Status:</span>
              <StatusBadge status={studentProfile.verification_status} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Record Created:</span>
              <span className="font-mono text-slate-700">
                {studentProfile.created_at ? formatDate(studentProfile.created_at) : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Last Reviewed:</span>
              <span className="font-mono text-slate-700">
                {studentProfile.reviewed_at ? formatDate(studentProfile.reviewed_at) : 'Pending initial review'}
              </span>
            </div>
          </div>

          {studentProfile.review_comment && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded text-blue-950 space-y-1">
              <span className="font-bold text-[11px] block text-blue-900">
                Official Review Comment:
              </span>
              <p className="italic text-blue-900">&ldquo;{studentProfile.review_comment}&rdquo;</p>
            </div>
          )}
        </div>
      </Card>
    )}

    {/* Note Modal */}
    <Dialog
      isOpen={isNoteModalOpen}
      onClose={() => setIsNoteModalOpen(false)}
      title={editingNote ? 'Edit Mentoring Session Note' : 'Log Mentoring Session Note'}
      description={`Record academic counseling, semester guidance, and milestones for ${profile.full_name}.`}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNoteModalOpen(false)}
            disabled={isSavingNote}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveNote}
            isLoading={isSavingNote}
          >
            {editingNote ? 'Update Note' : 'Save Session Note'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Session Date" htmlFor="nDate" required>
            <Input
              id="nDate"
              type="date"
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
            />
          </FormField>

          <FormField label="Note Visibility" htmlFor="nVis" required>
            <Select
              id="nVis"
              value={noteVisibility}
              onChange={(e) => setNoteVisibility(e.target.value as NoteVisibility)}
              options={[
                { value: 'shared_with_mentee', label: 'Shared with Mentee (Visible to Student)' },
                { value: 'private_mentor_only', label: 'Private Faculty Note (Mentor Only)' },
              ]}
            />
          </FormField>
        </div>

        <FormField
          label="Guidance & Counseling Observations"
          htmlFor="nContent"
          required
          description="Document discussion points, academic performance remarks, and recommended study plan."
        >
          <Textarea
            id="nContent"
            rows={4}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="e.g. Advised student to focus on Data Structures coursework and improve attendance in Laboratory practicals..."
          />
        </FormField>
      </div>
    </Dialog>

    {/* Recommendation Modal */}
    <Dialog
      isOpen={isRecModalOpen}
      onClose={() => setIsRecModalOpen(false)}
      title="Submit Faculty Recommendation to HOD"
      description={`Official recommendation to Department Head for ${profile.full_name} (${studentProfile.usn}).`}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRecModalOpen(false)}
            disabled={isSavingRec}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveRecommendation}
            isLoading={isSavingRec}
          >
            Submit to HOD
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <FormField label="Recommendation Category" htmlFor="rCat" required>
          <Select
            id="rCat"
            value={recCategory}
            onChange={(e) => setRecCategory(e.target.value as RecommendationCategory)}
            options={[
              { value: 'internship', label: 'Industry Internship / Research Project' },
              { value: 'scholarship', label: 'Merit Scholarship / Fee Concession' },
              { value: 'merit_award', label: 'Academic Excellence Award' },
              { value: 'remedial', label: 'Remedial Tutorial / Special Support' },
              { value: 'general', label: 'General Departmental Recommendation' },
            ]}
          />
        </FormField>

        <FormField
          label="Faculty Recommendation Justification & Details"
          htmlFor="rDetails"
          required
          description="Detail the student's merits, specific project/scholarship name, and your faculty endorsement."
        >
          <Textarea
            id="rDetails"
            rows={4}
            value={recDetails}
            onChange={(e) => setRecDetails(e.target.value)}
            placeholder="e.g. Recommended for the Google Summer of Code preparatory track based on exemplary performance in Systems Programming..."
          />
        </FormField>
      </div>
    </Dialog>

    {/* Delete Note Confirmation Dialog */}
    <ConfirmDialog
      isOpen={Boolean(noteToDelete)}
      title="Delete Mentoring Note"
      message="Are you sure you want to permanently delete this session advisory note from the student dossier?"
      confirmText="Confirm Delete"
      cancelText="Cancel"
      variant="danger"
      onConfirm={handleDeleteNote}
      onClose={() => setNoteToDelete(null)}
    />
  </div>
)
}

