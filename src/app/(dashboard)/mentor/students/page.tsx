'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  Search,
  Filter,
  Eye,
  ExternalLink,
  FileText,
  ThumbsUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchFilterBar } from '@/components/ui/SearchFilterBar'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  getMentorDashboardData,
  type MentorStudentSummary,
} from '@/lib/services/mentorService'
import { formatDate } from '@/lib/utils'

export default function MentorStudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<MentorStudentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const d = await getMentorDashboardData()
        if (isMounted) {
          setStudents(d.assignedStudents)
        }
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Failed to load assigned students.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const matchesSearch =
        search === '' ||
        st.fullName.toLowerCase().includes(search.toLowerCase()) ||
        st.usn.toLowerCase().includes(search.toLowerCase()) ||
        st.email.toLowerCase().includes(search.toLowerCase())

      const matchesSemester =
        semesterFilter === 'all' || String(st.semester) === semesterFilter

      const matchesStatus =
        statusFilter === 'all' || st.verificationStatus === statusFilter

      return matchesSearch && matchesSemester && matchesStatus
    })
  }, [students, search, semesterFilter, statusFilter])

  const columns: ColumnDef<MentorStudentSummary>[] = [
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
      key: 'fullName',
      header: 'Student Name & Contact',
      sortable: true,
      cell: (row) => (
        <div>
          <Link
            href={`/mentor/students/${row.id}`}
            className="font-bold text-slate-900 hover:text-accent hover:underline flex items-center gap-1.5"
          >
            <span>{row.fullName}</span>
            <ExternalLink size={11} className="text-slate-400" />
          </Link>
          <span className="text-[11px] text-slate-500 font-mono block">
            {row.email} {row.phone ? `• ${row.phone}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'semester',
      header: 'Academic Standing',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs">
            Sem {row.semester} ({row.department})
          </span>
          <span className="text-[11px] text-slate-400 block font-mono">
            Batch {row.academicBatch}
          </span>
        </div>
      ),
    },
    {
      key: 'verificationStatus',
      header: 'Review Status',
      sortable: true,
      cell: (row) => (
        <div>
          <StatusBadge status={row.verificationStatus} />
          {row.verificationStatus === 'submitted' && (
            <span className="block text-[10px] text-blue-600 font-medium mt-0.5">
              Action Required
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'academicSummary',
      header: 'Recent Performance',
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <span className="font-mono text-slate-700 block">
            {row.totalCourses} Courses ({row.totalCredits} Cr)
          </span>
          <div className="flex items-center gap-2 text-[11px]">
            {row.avgAttendance !== undefined ? (
              <span
                className={
                  row.avgAttendance < 75
                    ? 'text-rose-600 font-semibold'
                    : 'text-slate-500'
                }
              >
                Att: {row.avgAttendance}%
              </span>
            ) : (
              <span className="text-slate-400">Att: —</span>
            )}
            {row.activeBacklogs > 0 ? (
              <span className="text-rose-600 font-semibold">
                {row.activeBacklogs} Backlog{row.activeBacklogs > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-emerald-600">0 Backlogs</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'lastNoteDate',
      header: 'Last Mentored',
      sortable: true,
      cell: (row) => (
        <span className="text-slate-600 text-xs font-mono">
          {row.lastNoteDate ? formatDate(row.lastNoteDate) : <span className="text-slate-400">Never</span>}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Student Dossier',
      align: 'right',
      cell: (row) => (
        <Link href={`/mentor/students/${row.id}`}>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Eye size={12} />}
            className="h-7 text-xs"
          >
            Open Profile
          </Button>
        </Link>
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
        title="Assigned Students Roster"
        description="Official list of undergraduate students allocated to your faculty mentorship desk."
        breadcrumbs={[
          { label: 'Faculty Portal', href: '/mentor/dashboard' },
          { label: 'Assigned Students' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/mentor/notes">
              <Button size="sm" variant="outline" leftIcon={<FileText size={14} />}>
                Session Notes
              </Button>
            </Link>
            <Link href="/mentor/recommendations">
              <Button size="sm" variant="outline" leftIcon={<ThumbsUp size={14} />}>
                Recommendations
              </Button>
            </Link>
          </div>
        }
      />

      {/* Search and Filters Bar */}
      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search assigned students by name, USN, or email..."
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
            label: 'Verification Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Review States' },
              { value: 'submitted', label: 'Submitted for Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'correction_requested', label: 'Correction Requested' },
              { value: 'draft', label: 'Draft Mode' },
              { value: 'rejected', label: 'Rejected' },
            ],
          },
        ]}
        onResetFilters={() => {
          setSearch('')
          setSemesterFilter('all')
          setStatusFilter('all')
        }}
      />

      {/* Assigned Students Table */}
      <DataTable
        columns={columns as any}
        data={filteredStudents as any}
        defaultSortKey="usn"
        defaultSortDirection="asc"
        pageSize={10}
        onRowClick={(row) => router.push(`/mentor/students/${row.id}`)}
        emptyTitle="No assigned students found"
        emptyDescription={
          search || semesterFilter !== 'all' || statusFilter !== 'all'
            ? 'No students match your active filter criteria.'
            : 'You currently have no students assigned to your mentor profile. Allocations are managed by the Department HOD.'
        }
      />
    </div>
  )
}
