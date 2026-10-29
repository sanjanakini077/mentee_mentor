'use client'

import React, { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'

export interface ColumnDef<T> {
  key: string
  header: string | React.ReactNode
  cell?: (row: T, index: number) => React.ReactNode
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  className?: string
  width?: string
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[]
  data: T[]
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  pageSize?: number
  defaultSortKey?: string
  defaultSortDirection?: 'asc' | 'desc'
  className?: string
  rowKey?: (row: T, index: number) => string | number
  onRowClick?: (row: T) => void
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display matching the criteria.',
  emptyAction,
  pageSize = 10,
  defaultSortKey,
  defaultSortDirection = 'asc',
  className,
  rowKey,
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDirection)
  const [currentPage, setCurrentPage] = useState(1)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc')
      else {
        setSortKey(undefined)
        setSortDir('asc')
      }
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setCurrentPage(1)
  }

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return data

    return [...data].sort((a, b) => {
      const valA = a[sortKey]
      const valB = b[sortKey]

      if (valA === valB) return 0
      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA
      }

      const strA = String(valA).toLowerCase()
      const strB = String(valB).toLowerCase()
      return sortDir === 'asc'
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA)
    })
  }, [data, sortKey, sortDir])

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  if (isLoading) {
    return <TableSkeleton rows={pageSize || 5} columns={columns.length} />
  }

  return (
    <div
      className={cn(
        'w-full bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden flex flex-col',
        className
      )}
    >
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 select-none">
              {columns.map((col) => {
                const isSorted = sortKey === col.key
                const alignClass =
                  col.align === 'center'
                    ? 'text-center'
                    : col.align === 'right'
                    ? 'text-right'
                    : 'text-left'

                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    className={cn(
                      'px-4 py-3 font-semibold text-slate-600 uppercase tracking-wider text-[11px] whitespace-nowrap',
                      alignClass,
                      col.sortable &&
                        'cursor-pointer hover:bg-slate-100/80 transition-colors',
                      col.className
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        col.align === 'right' && 'justify-end',
                        col.align === 'center' && 'justify-center'
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDir === 'asc' ? (
                              <ArrowUp size={12} className="text-accent" />
                            ) : (
                              <ArrowDown size={12} className="text-accent" />
                            )
                          ) : (
                            <ArrowUpDown size={12} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    actionSlot={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const key = rowKey
                  ? rowKey(row, index)
                  : String(row.id || index)

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'transition-colors',
                      index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white',
                      'hover:bg-blue-50/40',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {columns.map((col) => {
                      const alignClass =
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left'

                      return (
                        <td
                          key={col.key}
                          className={cn(
                            'px-4 py-3 text-slate-700 whitespace-nowrap align-middle',
                            alignClass,
                            col.className
                          )}
                        >
                          {col.cell
                            ? col.cell(row, index)
                            : String(row[col.key] ?? '—')}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {sortedData.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

