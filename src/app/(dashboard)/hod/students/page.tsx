'use client'

import React, { useState, useMemo } from 'react'
import { Check, X, AlertTriangle, Eye, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchFilterBar } from '@/components/ui/SearchFilterBar'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { PREVIEW_ASSIGNED_STUDENTS } from '@/lib/preview-data'

type StudentRecord = typeof PREVIEW_ASSIGNED_STUDENTS[0]

export default function HodStudentsPage() {
  const { success, warning } = useToast()
  const [students, setStudents] = useState<StudentRecord[]>(
    PREVIEW_ASSIGNED_STUDENTS
  )
  const [search, setSearch] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeStudent, setActiveStudent] = useState<StudentRecord | null>(null)
  const [actionType, setActionType] = useState<
    'approve' | 'request_correction' | 'reject' | null
  >(null)
  const [comment, setComment] = useState('')

  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const matchesSearch =
        search === '' ||
        st.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        st.usn.toLowerCase().includes(search.toLowerCase())

      const matchesSemester =
        semesterFilter === 'all' || String(st.semester) === semesterFilter

      const matchesStatus =
        statusFilter === 'all' || st.verification_status === statusFilter

      return matchesSearch && matchesSemester && matchesStatus
    })
  }, [students, search, semesterFilter, statusFilter])

  const handleDecision = () => {
    if (!activeStudent || !actionType) return

    let newStatus: StudentRecord['verification_status'] = 'approved'
    if (actionType === 'request_correction') newStatus = 'correction_requested'
    if (actionType === 'reject') newStatus = 'rejected'

    setStudents((prev) =>
      prev.map((s) =>
        s.id === activeStudent.id
          ? { ...s, verification_status: newStatus }
          : s
      )
    )

    if (actionType === 'approve') {
      success(`Profile for ${activeStudent.profiles?.full_name} (${activeStudent.usn}) officially verified.`)
    } else if (actionType === 'request_correction') {
      warning(`Correction requested for ${activeStudent.profiles?.full_name}. Student notified.`)
    } else {
      warning(`Verification rejected for ${activeStudent.profiles?.full_name}.`)
    }

    setActiveStudent(null)
    setActionType(null)
    setComment('')
  }

  const columns: ColumnDef<StudentRecord>[] = [
    {
      key: 'usn',
      header: 'USN',
      sortable: true,
      cell: (row) => <span className="font-mono font-semibold">{row.usn}</span>,
    },
    {
      key: 'full_name',
      header: 'Student Name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.profiles?.full_name}</p>
          <p className="text-[11px] text-slate-500 font-mono">
            {row.profiles?.email}
          </p>
        </div>
      ),
    },
    {
      key: 'semester',
      header: 'Semester',
      sortable: true,
      align: 'center',
      cell: (row) => (
        <span className="font-semibold text-slate-700">Sem {row.semester}</span>
      ),
    },
    {
      key: 'cgpa',
      header: 'CGPA',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="font-bold text-slate-900">{row.cgpa.toFixed(2)}</span>
      ),
    },
    {
      key: 'mentor',
      header: 'Assigned Mentor',
      cell: (row) => (
        <span className="text-slate-700 text-xs font-medium">
          {row.mentorName}
        </span>
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
      header: 'Administrative Action',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.verification_status === 'submitted' ? (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setActiveStudent(row)
                  setActionType('approve')
                }}
                className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700"
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setActiveStudent(row)
                  setActionType('request_correction')
                }}
                className="h-7 text-xs px-2"
              >
                Correction
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setActiveStudent(row)
                setActionType('approve')
              }}
              className="h-7 text-xs"
            >
              Re-evaluate
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Student Directory & Verification Desk"
        description="Verify student demographic and semester data against University Admissions registers."
        breadcrumbs={[
          { label: 'Administration', href: '/hod' },
          { label: 'Students' },
        ]}
      />

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
              { value: '3', label: 'Semester 3' },
              { value: '5', label: 'Semester 5' },
              { value: '7', label: 'Semester 7' },
            ],
          },
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Verification Statuses' },
              { value: 'submitted', label: 'Submitted (Awaiting Approval)' },
              { value: 'approved', label: 'Approved' },
              { value: 'correction_requested', label: 'Correction Requested' },
              { value: 'draft', label: 'Draft' },
            ],
          },
        ]}
        onResetFilters={() => {
          setSearch('')
          setSemesterFilter('all')
          setStatusFilter('all')
        }}
      />

      <DataTable
        columns={columns as any}
        data={filteredStudents as any}
        defaultSortKey="usn"
        defaultSortDirection="asc"
        pageSize={10}
      />

      {/* Decision Dialog */}
      {activeStudent && actionType && (
        <Dialog
          isOpen={Boolean(activeStudent && actionType)}
          onClose={() => {
            setActiveStudent(null)
            setActionType(null)
          }}
          title={
            actionType === 'approve'
              ? `Approve Verification — ${activeStudent.profiles?.full_name}`
              : actionType === 'request_correction'
              ? `Request Correction — ${activeStudent.profiles?.full_name}`
              : `Reject Submission — ${activeStudent.profiles?.full_name}`
          }
          description={`USN: ${activeStudent.usn} • Semester ${activeStudent.semester} • Current CGPA: ${activeStudent.cgpa}`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveStudent(null)
                  setActionType(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant={
                  actionType === 'reject'
                    ? 'danger'
                    : actionType === 'approve'
                    ? 'primary'
                    : 'secondary'
                }
                size="sm"
                onClick={handleDecision}
              >
                {actionType === 'approve'
                  ? 'Confirm Approval'
                  : actionType === 'request_correction'
                  ? 'Send Correction Notice'
                  : 'Reject Submission'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
              <p>
                <strong className="text-slate-800">Department:</strong> Computer
                Science & Engineering
              </p>
              <p>
                <strong className="text-slate-800">Assigned Mentor:</strong>{' '}
                {activeStudent.mentorName}
              </p>
              <p>
                <strong className="text-slate-800">Contact:</strong>{' '}
                {activeStudent.phone} • {activeStudent.profiles?.email}
              </p>
            </div>

            <FormField
              label="HOD Endorsement Remarks"
              required={actionType !== 'approve'}
              htmlFor="decisionComment"
              description="Comments will be recorded in the audit log and visible to the student and mentor."
            >
              <Textarea
                id="decisionComment"
                rows={3}
                placeholder={
                  actionType === 'approve'
                    ? 'Optional: Verified against exam cell register...'
                    : 'Specify required corrections (e.g., mismatch in parent phone number)...'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </FormField>
          </div>
        </Dialog>
      )}
    </div>
  )
}

