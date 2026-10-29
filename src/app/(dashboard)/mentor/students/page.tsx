'use client'

import React, { useState, useMemo } from 'react'
import { Eye, FileText, ThumbsUp } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchFilterBar } from '@/components/ui/SearchFilterBar'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { PREVIEW_ASSIGNED_STUDENTS } from '@/lib/preview-data'

type AssignedStudent = typeof PREVIEW_ASSIGNED_STUDENTS[0]

export default function MentorStudentsPage() {
  const [search, setSearch] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState<AssignedStudent | null>(
    null
  )

  // Filter students
  const filteredStudents = useMemo(() => {
    return PREVIEW_ASSIGNED_STUDENTS.filter((st) => {
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
  }, [search, semesterFilter, statusFilter])

  const columns: ColumnDef<AssignedStudent>[] = [
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
      key: 'backlogs',
      header: 'Backlogs',
      sortable: true,
      align: 'center',
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold ${
            row.backlogs === 0
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-rose-50 text-rose-700'
          }`}
        >
          {row.backlogs}
        </span>
      ),
    },
    {
      key: 'verification_status',
      header: 'Status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.verification_status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      cell: (row) => (
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Eye size={13} />}
          onClick={() => setSelectedStudent(row)}
          className="h-7 text-xs"
        >
          Profile
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Students Directory"
        description="Search, inspect academic progress, and manage counseling for your assigned mentees."
        breadcrumbs={[
          { label: 'Faculty Portal', href: '/mentor' },
          { label: 'Assigned Students' },
        ]}
      />

      {/* Filter and Search Bar */}
      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by student name or USN..."
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
            label: 'Verification Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'submitted', label: 'Submitted (Pending Review)' },
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

      {/* Students Data Table */}
      <DataTable
        columns={columns as any}
        data={filteredStudents as any}
        defaultSortKey="usn"
        defaultSortDirection="asc"
        pageSize={10}
      />

      {/* Student Profile Quick View Dialog */}
      {selectedStudent && (
        <Dialog
          isOpen={Boolean(selectedStudent)}
          onClose={() => setSelectedStudent(null)}
          title={`Student Profile — ${selectedStudent.profiles?.full_name}`}
          description={`USN: ${selectedStudent.usn} • Semester ${selectedStudent.semester} • Department of CSE`}
          footer={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedStudent(null)}
            >
              Close
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded border border-slate-100">
              <div>
                <span className="text-slate-400 block">Verification Status:</span>
                <StatusBadge status={selectedStudent.verification_status} />
              </div>
              <div>
                <span className="text-slate-400 block">Cumulative CGPA:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedStudent.cgpa} / 10.0
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Active Backlogs:</span>
                <span className="font-semibold text-slate-800">
                  {selectedStudent.backlogs}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Blood Group:</span>
                <span className="font-semibold text-slate-800">
                  {selectedStudent.blood_group || '—'}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="font-semibold text-slate-800">Contact Details</p>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block">Phone:</span>
                  <span className="font-mono">{selectedStudent.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email:</span>
                  <span className="font-mono">{selectedStudent.profiles?.email}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Address:</span>
                  <span>{selectedStudent.address || '—'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="font-semibold text-slate-800">Parent / Guardian</p>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block">Parent Name:</span>
                  <span>{selectedStudent.parent_name || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Parent Phone:</span>
                  <span className="font-mono">
                    {selectedStudent.parent_phone || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}

