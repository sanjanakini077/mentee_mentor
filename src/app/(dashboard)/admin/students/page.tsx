'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Users,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  BookOpen,
  UserCheck,
  Mail,
  Phone,
  Building,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchFilterBar } from '@/components/ui/SearchFilterBar'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { getStore } from '@/lib/storage/demoStore'
import { formatDate } from '@/lib/utils'
import type { StudentProfile, Profile, AcademicRecord } from '@/types'

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [mentors, setMentors] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

    // Filters
    const [search, setSearch] = useState('')
    const [semesterFilter, setSemesterFilter] = useState('all')
    const [mentorFilter, setMentorFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')

    // Inspector Dialog State
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
    const [studentAcademics, setStudentAcademics] = useState<AcademicRecord[]>([])
    const [isLoadingAcademics, setIsLoadingAcademics] = useState(false)

    const loadData = () => {
      try {
        const store = getStore()
        const mentorList = store.profiles.filter((p) => p.role === 'mentor')
        setMentors(mentorList)

        const studentList = store.studentProfiles.map((s) => {
          const prof = store.profiles.find((p) => p.id === s.profile_id)
          const activeAssignment = store.mentorAssignments.find(
            (a) => a.student_profile_id === s.id && a.is_active
          )
          const mentor = activeAssignment
            ? store.profiles.find((p) => p.id === activeAssignment.mentor_profile_id)
            : null

          return {
            ...s,
            profiles: prof,
            activeMentor: mentor,
          }
        })

        setStudents(studentList)
      } catch (err: any) {
        setError(err?.message || 'Failed to load department student directory.')
      } finally {
        setIsLoading(false)
      }
    }

    useEffect(() => {
      loadData()
      window.addEventListener('mms-store-changed', loadData)
      return () => window.removeEventListener('mms-store-changed', loadData)
    }, [])

    // Filtered Students
    const filteredStudents = useMemo(() => {
      return students.filter((st) => {
        const studentName = st.profiles?.full_name || ''
        const studentUsn = st.usn || ''
        const matchesSearch =
          search === '' ||
        studentName.toLowerCase().includes(search.toLowerCase()) ||
          studentUsn.toLowerCase().includes(search.toLowerCase())

        const matchesSemester =
          semesterFilter === 'all' || String(st.semester) === semesterFilter

        const matchesStatus =
          statusFilter === 'all' || st.verification_status === statusFilter

        const matchesMentor =
          mentorFilter === 'all' ||
          (mentorFilter === 'unassigned' && !st.activeMentor) ||
          st.activeMentor?.id === mentorFilter

        return matchesSearch && matchesSemester && matchesStatus && matchesMentor
      })
  }, [students, search, semesterFilter, statusFilter, mentorFilter])

    // Open Student Inspection Modal
    const openInspectModal = (st: any) => {
      setSelectedStudent(st)
      setIsLoadingAcademics(true)

      try {
        const store = getStore()
        const records = store.academicRecords
          .filter((r) => r.student_profile_id === st.id || r.student_id === st.id)
          .sort((a, b) => a.semester - b.semester)

        setStudentAcademics(records)
      } catch (err) {
        console.warn('Could not load course history:', err)
      } finally {
        setIsLoadingAcademics(false)
      }
    }

  const columns: ColumnDef<any>[] = [
        {
          key: 'usn',
          header: 'USN',
          sortable: true,
          cell: (row) => (
            <span className="font-mono font-bold text-slate-900 text-xs">
              {row.usn}
            </span>
          ),
        },
        {
          key: 'full_name',
          header: 'Student Name',
          sortable: true,
          cell: (row) => (
            <div>
                <p className="font-semibold text-slate-900 text-xs">
                  {row.profiles?.full_name}
                </p>
                <span className="text-[11px] text-slate-400 font-mono">
                  {row.profiles?.email}
            </span>
        </div >
      ),
},
{
  key: 'semester',
    header: 'Semester',
      sortable: true,
          cell: (row) => (
        <span className="font-semibold text-slate-800 text-xs">
          Sem {row.semester}
        </span>
          ),
    },
{
  key: 'mentor',
      header: 'Allocated Faculty Mentor',
        cell: (row) => (
        row.activeMentor ? (
    <span className="font-semibold text-slate-800 text-xs">
      {row.activeMentor.full_name}
    </span>
  ) : (
    <span className="text-amber-700 font-medium text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
      Unassigned
    </span>
  )
      ),
},
{
  key: 'verification_status',
    header: 'Verification Status',
      sortable: true,
        cell: (row) => <StatusBadge status={row.verification_status} />,
    },
{
  key: 'actions',
      header: 'Actions',
        align: 'right',
          cell: (row) => (
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Eye size={12} />}
          onClick={() => openInspectModal(row)}
          className="h-7 text-xs"
        >
          Inspect Dossier
        </Button>
          ),
    },
  ]

if (isLoading) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

return (
  <div className="space-y-6">
    <PageHeader
      title="Department Student Directory"
      description="Comprehensive register of undergraduate students enrolled in the department."
      breadcrumbs={[
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Student Directory' },
      ]}
    />

    {/* Search and Filters */}
    <SearchFilterBar
      searchQuery={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search students by name or USN..."
      resultsCount={filteredStudents.length}
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
        {
          key: 'status',
          label: 'Review Status',
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { value: 'all', label: 'All Review States' },
            { value: 'submitted', label: 'Awaiting Review' },
            { value: 'approved', label: 'Approved' },
            { value: 'correction_requested', label: 'Correction Requested' },
            { value: 'draft', label: 'Draft' },
            { value: 'rejected', label: 'Rejected' },
          ],
        },
        {
          key: 'mentor',
          label: 'Faculty Mentor',
          value: mentorFilter,
          onChange: setMentorFilter,
          options: [
            { value: 'all', label: 'All Mentors' },
            { value: 'unassigned', label: 'Unassigned Mentees' },
            ...mentors.map((m) => ({ value: m.id, label: m.full_name })),
          ],
        },
      ]}
      onResetFilters={() => {
        setSearch('')
        setSemesterFilter('all')
        setStatusFilter('all')
        setMentorFilter('all')
      }}
    />

    {/* Directory Table */}
    <DataTable
      columns={columns as any}
      data={filteredStudents as any}
      defaultSortKey="usn"
      defaultSortDirection="asc"
      pageSize={10}
      emptyTitle="No students found"
      emptyDescription="No student records match your selected criteria."
    />

      {/* Inspection Modal */ }
      {selectedStudent && (
      <Dialog
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        title={`Student Dossier — ${selectedStudent.profiles?.full_name}`}
        description={`USN: ${selectedStudent.usn} • Semester ${selectedStudent.semester} • ${selectedStudent.department}`}
        footer={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedStudent(null)}
            >
              Close Dossier
            </Button>
        }
      >
            <div className="space-y-4 text-xs">
              {/* Demographic Summary */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email Address</span>
                    <span className="font-mono text-slate-800">{selectedStudent.profiles?.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                    <span className="font-mono text-slate-800">
                      {selectedStudent.profiles?.phone_number || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Assigned Mentor</span>
                    <span className="font-semibold text-slate-800">
                      {selectedStudent.activeMentor?.full_name || 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Verification Status</span>
                    <StatusBadge status={selectedStudent.verification_status} />
                  </div>
                </div>
              </div>

              {/* Academic History in Modal */}
              <div>
                <span className="font-bold text-slate-800 block mb-1">
                  Semester Coursework History ({studentAcademics.length})
                </span>
                {isLoadingAcademics ? (
                  <Skeleton className="h-24 w-full" />
                ) : studentAcademics.length === 0 ? (
                  <p className="text-slate-400 py-3 text-center italic">
                    No academic coursework records entered by student.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {studentAcademics.map((rec) => (
                      <div key={rec.id} className="p-2 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-mono font-bold text-slate-900">{rec.course_code}</span> — {rec.course_name}
                          <span className="block text-[10px] text-slate-400 font-mono">
                            Sem {rec.semester} • {rec.credits} Credits • Att: {rec.attendance_percentage ?? '—'}%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-800">
                            {rec.grade ? `Grade ${rec.grade}` : `${rec.marks_obtained}/${rec.max_marks}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Official Review Comment if any */}
              {selectedStudent.review_comment && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded text-blue-900">
                  <span className="font-bold block text-[11px]">Last Review Decision Note:</span>
                  <p className="italic mt-0.5">&ldquo;{selectedStudent.review_comment}&rdquo;</p>
                  {selectedStudent.reviewed_at && (
                    <span className="text-[10px] text-blue-600 block font-mono mt-1">
                      Endorsed on {formatDate(selectedStudent.reviewed_at)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Dialog>
      )}
        </div>
        )
}
