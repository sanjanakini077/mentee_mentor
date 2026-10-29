'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Eye, ScrollText, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchFilterBar } from '@/components/ui/SearchFilterBar'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { getAuditLogsDeskData } from '@/lib/services/adminService'
import { formatDateTime } from '@/lib/utils'
import type { AuditLog } from '@/types'

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const loadLogs = async () => {
    try {
      const data = await getAuditLogsDeskData()
      setLogs(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load audit history.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const actorName = log.actor?.full_name || ''
      const action = log.action || ''
      const targetType = log.target_type || ''

      const matchesSearch =
        search === '' ||
        action.toLowerCase().includes(search.toLowerCase()) ||
        targetType.toLowerCase().includes(search.toLowerCase()) ||
        actorName.toLowerCase().includes(search.toLowerCase())

      const matchesAction =
        actionFilter === 'all' || action.toLowerCase().includes(actionFilter.toLowerCase())

      return matchesSearch && matchesAction
    })
  }, [logs, search, actionFilter])

  const columns: ColumnDef<AuditLog>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-[11px] text-slate-600">
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Administrative Actor',
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-900 text-xs">{row.actor?.full_name || 'System / Service Role'}</p>
          <span className="text-[10px] text-slate-400 font-mono uppercase">
            {row.actor?.role || 'Service'}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Logged Action',
      sortable: true,
      cell: (row) => (
        <Badge
          variant={
            row.action.includes('APPROVED')
              ? 'success'
              : row.action.includes('ASSIGNED')
              ? 'primary'
              : row.action.includes('REJECTED')
              ? 'danger'
              : 'default'
          }
          className="font-mono text-[10px]"
        >
          {row.action}
        </Badge>
      ),
    },
    {
      key: 'target_type',
      header: 'Target Entity',
      sortable: true,
      cell: (row) => (
        <span className="text-slate-600 font-mono text-xs">
          {row.target_type}
        </span>
      ),
    },
    {
      key: 'metadata',
      header: 'Metadata Summary',
      cell: (row) => (
        <span className="text-slate-500 text-xs font-mono truncate max-w-xs block">
          {JSON.stringify(row.metadata || {})}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Details',
      align: 'right',
      cell: (row) => (
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Eye size={12} />}
          onClick={() => setSelectedLog(row)}
          className="h-7 text-xs"
        >
          Inspect Record
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
        title="Department Immutable Audit Trail"
        description="Append-only institutional activity register tracking verifications, recommendations, and mentor allocations."
        breadcrumbs={[
          { label: 'Administration', href: '/admin/dashboard' },
          { label: 'Audit Log' },
        ]}
      />

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter audit records by action or actor..."
        resultsCount={filteredLogs.length}
        filters={[
          {
            key: 'action',
            label: 'Action Filter',
            value: actionFilter,
            onChange: setActionFilter,
            options: [
              { value: 'all', label: 'All Logged Actions' },
              { value: 'VERIFICATION', label: 'Student Profile Verifications' },
              { value: 'RECOMMENDATION', label: 'Recommendation Decisions' },
              { value: 'ASSIGNED', label: 'Mentor Allocations' },
            ],
          },
        ]}
        onResetFilters={() => {
          setSearch('')
          setActionFilter('all')
        }}
      />

      <DataTable
        columns={columns as any}
        data={filteredLogs as any}
        defaultSortKey="created_at"
        defaultSortDirection="desc"
        pageSize={10}
        emptyTitle="No audit records on file"
        emptyDescription="Administrative operations and approval decisions will be permanently logged here."
      />

      {/* Audit Record Inspector Dialog */}
      {selectedLog && (
        <Dialog
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Audit Record — ${selectedLog.action}`}
          description={`Timestamp: ${formatDateTime(selectedLog.created_at)} • Immutable Register`}
          footer={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedLog(null)}
            >
              Close
            </Button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Actor Identity:</span>
                <span className="font-semibold text-slate-800">
                  {selectedLog.actor?.full_name || 'System Service'} ({selectedLog.actor?.role || 'service'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action:</span>
                <span className="font-mono text-slate-800 font-bold">
                  {selectedLog.action}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Entity Type:</span>
                <span className="font-mono text-slate-800">
                  {selectedLog.target_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Record ID:</span>
                <span className="font-mono text-slate-800">
                  {selectedLog.target_id}
                </span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block mb-1">
                Parsed Action Metadata Payload:
              </span>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded text-[11px] font-mono overflow-x-auto">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}

