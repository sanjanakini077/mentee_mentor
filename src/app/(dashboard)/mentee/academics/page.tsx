'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { SearchFilterBar } from '@/components/ui/SearchFilterBar'
import { StatusBadge } from '@/components/ui/Badge'
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
  getMenteeFullData,
  saveAcademicRecord,
  deleteAcademicRecord,
  type MenteeFullData,
} from '@/lib/services/menteeService'
import type { AcademicRecord } from '@/types'

export default function MenteeAcademicsPage() {
  const { success, error: toastError } = useToast()

  const [data, setData] = useState<MenteeFullData | null>(null)
  const [records, setRecords] = useState<AcademicRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Search & Filter
  const [search, setSearch] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('all')

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AcademicRecord | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form Fields
  const [formSemester, setFormSemester] = useState('1')
  const [formAcademicYear, setFormAcademicYear] = useState('2024-25')
  const [formCourseCode, setFormCourseCode] = useState('')
  const [formCourseName, setFormCourseName] = useState('')
  const [formCredits, setFormCredits] = useState('3')
  const [formMarks, setFormMarks] = useState('')
  const [formMaxMarks, setFormMaxMarks] = useState('100')
  const [formGrade, setFormGrade] = useState('')
  const [formGradePoints, setFormGradePoints] = useState('')
  const [formAttendance, setFormAttendance] = useState('')
  const [formIsBacklog, setFormIsBacklog] = useState(false)
  const [formRemarks, setFormRemarks] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Delete Confirmation State
  const [recordToDelete, setRecordToDelete] = useState<AcademicRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    try {
      const full = await getMenteeFullData()
      setData(full)
      setRecords(full.academicRecords)
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load academic records.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        search === '' ||
        r.course_code?.toLowerCase().includes(search.toLowerCase()) ||
        r.course_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.remarks?.toLowerCase().includes(search.toLowerCase())

      const matchesSemester =
        semesterFilter === 'all' || String(r.semester) === semesterFilter

      return matchesSearch && matchesSemester
    })
  }, [records, search, semesterFilter])

  const openAddModal = () => {
    setEditingRecord(null)
    setFormSemester(String(data?.studentProfile.semester || '1'))
    setFormAcademicYear('2024-25')
    setFormCourseCode('')
    setFormCourseName('')
    setFormCredits('3')
    setFormMarks('')
    setFormMaxMarks('100')
    setFormGrade('')
    setFormGradePoints('')
    setFormAttendance('85')
    setFormIsBacklog(false)
    setFormRemarks('')
    setFormErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (rec: AcademicRecord) => {
    setEditingRecord(rec)
    setFormSemester(String(rec.semester))
    setFormAcademicYear(rec.academic_year || '2024-25')
    setFormCourseCode(rec.course_code || '')
    setFormCourseName(rec.course_name || '')
    setFormCredits(String(rec.credits || 3))
    setFormMarks(rec.marks_obtained !== null && rec.marks_obtained !== undefined ? String(rec.marks_obtained) : '')
    setFormMaxMarks(String(rec.max_marks || 100))
    setFormGrade(rec.grade || '')
    setFormGradePoints(rec.grade_points !== null && rec.grade_points !== undefined ? String(rec.grade_points) : '')
    setFormAttendance(
      rec.attendance_percentage !== null && rec.attendance_percentage !== undefined
        ? String(rec.attendance_percentage)
        : ''
    )
    setFormIsBacklog(Boolean(rec.is_backlog))
    setFormRemarks(rec.remarks || '')
    setFormErrors({})
    setIsModalOpen(true)
  }

  const validateForm = () => {
    const errs: Record<string, string> = {}
    if (!formCourseCode.trim()) errs.courseCode = 'Course code is required (e.g. CS501).'
    if (!formCourseName.trim()) errs.courseName = 'Subject/course title is required.'
    if (!formCredits || Number(formCredits) <= 0) errs.credits = 'Credits must be at least 1.'

    if (formMarks && (Number(formMarks) < 0 || Number(formMarks) > Number(formMaxMarks))) {
      errs.marks = `Marks must be between 0 and ${formMaxMarks}.`
    }

    if (formAttendance && (Number(formAttendance) < 0 || Number(formAttendance) > 100)) {
      errs.attendance = 'Attendance percentage must be between 0 and 100.'
    }

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSaveRecord = async () => {
    if (!validateForm() || !data) return
    setIsSaving(true)

    try {
      await saveAcademicRecord({
        id: editingRecord?.id,
        studentProfileId: data.studentProfile.id,
        academicYear: formAcademicYear,
        semester: Number(formSemester),
        courseCode: formCourseCode,
        courseName: formCourseName,
        credits: Number(formCredits),
        marksObtained: formMarks ? Number(formMarks) : undefined,
        maxMarks: Number(formMaxMarks),
        grade: formGrade || undefined,
        gradePoints: formGradePoints ? Number(formGradePoints) : undefined,
        attendancePercentage: formAttendance ? Number(formAttendance) : undefined,
        isBacklog: formIsBacklog,
        remarks: formRemarks || undefined,
        currentVerificationStatus: data.studentProfile.verification_status,
      })

      success(
        editingRecord
          ? `Course ${formCourseCode.toUpperCase()} updated successfully.`
          : `Course ${formCourseCode.toUpperCase()} added to academic records.`
      )
      setIsModalOpen(false)
      await loadData()
    } catch (err: any) {
      toastError(err?.message || 'Failed to save academic record.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirmed = async () => {
    if (!recordToDelete || !data) return
    setIsDeleting(true)

    try {
      await deleteAcademicRecord(
        recordToDelete.id,
        data.studentProfile.verification_status
      )
      success(`Course ${recordToDelete.course_code} removed.`)
      setRecordToDelete(null)
      await loadData()
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete record.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (loadError || !data) {
    return (
      <div className="p-6 bg-white border border-rose-200 rounded-md space-y-3">
        <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
          <AlertCircle size={18} />
          <span>Error Loading Academic Records</span>
        </div>
        <p className="text-xs text-slate-600">{loadError || 'Unable to access academic history.'}</p>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  const status = data.studentProfile.verification_status
  const isLocked = status === 'submitted' || status === 'approved'

  // Summary Metrics
  const totalCredits = records.reduce((acc, r) => acc + (r.credits || 0), 0)
  const backlogsCount = records.filter((r) => r.is_backlog).length
  const avgAttendance =
    records.length > 0
      ? (
          records.reduce((acc, r) => acc + (r.attendance_percentage || 0), 0) /
          records.length
        ).toFixed(1)
      : '—'

  const columns: ColumnDef<AcademicRecord>[] = [
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
        <span className="font-mono font-bold text-slate-800 text-xs">
          {row.course_code}
        </span>
      ),
    },
    {
      key: 'course_name',
      header: 'Course / Subject Title',
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
        const isLow = att < 75
        return (
          <span
            className={`font-mono text-xs font-semibold ${
              isLow ? 'text-rose-600' : 'text-slate-700'
            }`}
          >
            {att}%
          </span>
        )
      },
    },
    {
      key: 'is_backlog',
      header: 'Status',
      cell: (row) => (
        <span
          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
            row.is_backlog
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {row.is_backlog ? 'Backlog' : 'Cleared'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) =>
        !isLocked ? (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openEditModal(row)}
              className="h-7 w-7 p-0 text-slate-600 hover:text-accent"
              title="Edit course record"
            >
              <Edit2 size={13} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRecordToDelete(row)}
              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
              title="Delete course record"
            >
              <Trash2 size={13} />
            </Button>
          </div>
        ) : (
          <span className="text-slate-400 text-[11px] flex items-center justify-end gap-1">
            <Lock size={12} /> Locked
          </span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Academic Records"
        description="Semester-wise course enrollments, examination grades, and attendance register."
        breadcrumbs={[
          { label: 'Student Portal', href: '/mentee/dashboard' },
          { label: 'Academic Records' },
        ]}
        badge={<StatusBadge status={status} />}
        actions={
          !isLocked ? (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus size={14} />}
              onClick={openAddModal}
            >
              Add Course Record
            </Button>
          ) : undefined
        }
      />

      {/* Lock Banner if under review or approved */}
      {isLocked && (
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-700 flex items-start gap-3 shadow-xs">
          <Lock size={16} className="text-slate-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-900">
              Academic Record Entry Is Currently Locked
            </p>
            <p className="text-slate-600 mt-0.5">
              {status === 'submitted'
                ? 'Your submitted academic records are being reviewed by your mentor and HOD. Edits are disabled until evaluation concludes.'
                : 'Your academic records are officially approved for this term. Contact the department administration to request any revisions.'}
            </p>
          </div>
        </div>
      )}

      {/* Academic Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs">
          <span className="text-[11px] uppercase font-semibold text-slate-400 block">
            Registered Courses
          </span>
          <span className="text-xl font-bold text-slate-900 mt-0.5 block">
            {records.length}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs">
          <span className="text-[11px] uppercase font-semibold text-slate-400 block">
            Total Credits
          </span>
          <span className="text-xl font-bold text-slate-900 mt-0.5 block">
            {totalCredits}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs">
          <span className="text-[11px] uppercase font-semibold text-slate-400 block">
            Average Attendance
          </span>
          <span className="text-xl font-bold text-slate-900 mt-0.5 block font-mono">
            {avgAttendance}%
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs">
          <span className="text-[11px] uppercase font-semibold text-slate-400 block">
            Recorded Backlogs
          </span>
          <span
            className={`text-xl font-bold mt-0.5 block ${
              backlogsCount > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {backlogsCount}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter courses by code or title (e.g. CS501)..."
        resultsCount={filteredRecords.length}
        filters={[
          {
            key: 'semester',
            label: 'Semester',
            value: semesterFilter,
            onChange: setSemesterFilter,
            options: [
              { value: 'all', label: 'All Semesters' },
              { value: '1', label: 'Semester 1' },
              { value: '2', label: 'Semester 2' },
              { value: '3', label: 'Semester 3' },
              { value: '4', label: 'Semester 4' },
              { value: '5', label: 'Semester 5' },
              { value: '6', label: 'Semester 6' },
              { value: '7', label: 'Semester 7' },
              { value: '8', label: 'Semester 8' },
            ],
          },
        ]}
        onResetFilters={() => {
          setSearch('')
          setSemesterFilter('all')
        }}
      />

      {/* DataTable */}
      <DataTable
        columns={columns as any}
        data={filteredRecords as any}
        defaultSortKey="course_code"
        defaultSortDirection="asc"
        pageSize={10}
        emptyTitle="No academic records found"
        emptyDescription={
          isLocked
            ? 'No courses are recorded for the selected filter.'
            : 'Click "Add Course Record" above to enter your subject performance and grades.'
        }
      />

      {/* Add / Edit Course Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? `Edit Course — ${editingRecord.course_code}` : 'Add New Course Record'}
        description="Enter the subject details, marks obtained, examination credits, and attendance percentage."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveRecord}
              isLoading={isSaving}
            >
              {editingRecord ? 'Save Changes' : 'Add Course'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Semester" htmlFor="fSem" required>
              <Select
                id="fSem"
                value={formSemester}
                onChange={(e) => setFormSemester(e.target.value)}
                options={[
                  { value: '1', label: 'Semester 1' },
                  { value: '2', label: 'Semester 2' },
                  { value: '3', label: 'Semester 3' },
                  { value: '4', label: 'Semester 4' },
                  { value: '5', label: 'Semester 5' },
                  { value: '6', label: 'Semester 6' },
                  { value: '7', label: 'Semester 7' },
                  { value: '8', label: 'Semester 8' },
                ]}
              />
            </FormField>

            <FormField label="Academic Year" htmlFor="fAy" required>
              <Input
                id="fAy"
                value={formAcademicYear}
                onChange={(e) => setFormAcademicYear(e.target.value)}
                placeholder="2024-25"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <FormField
                label="Course Code"
                htmlFor="fCode"
                required
                error={formErrors.courseCode}
              >
                <Input
                  id="fCode"
                  value={formCourseCode}
                  onChange={(e) => setFormCourseCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CS501"
                  className="font-mono uppercase"
                />
              </FormField>
            </div>
            <div className="col-span-2">
              <FormField
                label="Course / Subject Title"
                htmlFor="fName"
                required
                error={formErrors.courseName}
              >
                <Input
                  id="fName"
                  value={formCourseName}
                  onChange={(e) => setFormCourseName(e.target.value)}
                  placeholder="e.g. Database Management Systems"
                />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Course Credits" htmlFor="fCredits" required error={formErrors.credits}>
              <Input
                id="fCredits"
                type="number"
                min="1"
                max="10"
                value={formCredits}
                onChange={(e) => setFormCredits(e.target.value)}
              />
            </FormField>

            <FormField label="Marks Obtained" htmlFor="fMarks" error={formErrors.marks}>
              <Input
                id="fMarks"
                type="number"
                min="0"
                max={formMaxMarks}
                value={formMarks}
                onChange={(e) => setFormMarks(e.target.value)}
                placeholder="85"
              />
            </FormField>

            <FormField label="Max Marks" htmlFor="fMaxMarks">
              <Input
                id="fMaxMarks"
                type="number"
                value={formMaxMarks}
                onChange={(e) => setFormMaxMarks(e.target.value)}
                placeholder="100"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Letter Grade" htmlFor="fGrade">
              <Select
                id="fGrade"
                value={formGrade}
                onChange={(e) => setFormGrade(e.target.value)}
                options={[
                  { value: '', label: 'Select Grade' },
                  { value: 'O', label: 'O (Outstanding)' },
                  { value: 'A+', label: 'A+ (Excellent)' },
                  { value: 'A', label: 'A (Very Good)' },
                  { value: 'B+', label: 'B+ (Good)' },
                  { value: 'B', label: 'B (Above Average)' },
                  { value: 'C', label: 'C (Average)' },
                  { value: 'P', label: 'P (Pass)' },
                  { value: 'F', label: 'F (Fail)' },
                  { value: 'AB', label: 'AB (Absent)' },
                ]}
              />
            </FormField>

            <FormField label="Grade Points" htmlFor="fGp">
              <Input
                id="fGp"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formGradePoints}
                onChange={(e) => setFormGradePoints(e.target.value)}
                placeholder="9.0"
              />
            </FormField>

            <FormField
              label="Attendance %"
              htmlFor="fAtt"
              error={formErrors.attendance}
            >
              <Input
                id="fAtt"
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={formAttendance}
                onChange={(e) => setFormAttendance(e.target.value)}
                placeholder="90.5"
              />
            </FormField>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="fBacklog"
              checked={formIsBacklog}
              onChange={(e) => setFormIsBacklog(e.target.checked)}
              className="rounded border-slate-300 text-accent focus:ring-accent/20"
            />
            <label htmlFor="fBacklog" className="text-slate-700 font-medium">
              Flag as active backlog (subject not cleared in previous attempt)
            </label>
          </div>

          <FormField label="Faculty Remarks / Internal Note" htmlFor="fRemarks">
            <Textarea
              id="fRemarks"
              rows={2}
              value={formRemarks}
              onChange={(e) => setFormRemarks(e.target.value)}
              placeholder="e.g. Continuous evaluation coursework submitted..."
            />
          </FormField>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(recordToDelete)}
        title={`Delete Course — ${recordToDelete?.course_code}`}
        message={`Are you sure you want to remove ${recordToDelete?.course_code} (${recordToDelete?.course_name}) from your academic records? This action cannot be undone.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirmed}
        onClose={() => setRecordToDelete(null)}
      />
    </div>
  )
}
