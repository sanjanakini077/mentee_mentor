import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  pageSize?: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1 && !totalItems) return null

  const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : undefined
  const endItem = totalItems
    ? Math.min(currentPage * pageSize, totalItems)
    : undefined

  // Compute visible page numbers
  const pages: (number | 'ellipsis')[] = []
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('ellipsis')

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i)
    }

    if (currentPage < totalPages - 2) pages.push('ellipsis')
    if (!pages.includes(totalPages)) pages.push(totalPages)
  }

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-4 border-t border-slate-200 bg-white text-xs text-slate-600',
        className
      )}
    >
      <div>
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Showing <strong className="text-slate-800">{startItem}</strong> to{' '}
            <strong className="text-slate-800">{endItem}</strong> of{' '}
            <strong className="text-slate-800">{totalItems}</strong> entries
          </span>
        ) : (
          <span>
            Page <strong className="text-slate-800">{currentPage}</strong> of{' '}
            <strong className="text-slate-800">{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
          className="h-8 w-8 p-0"
        >
          <ChevronLeft size={14} />
        </Button>

        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`ell-${idx}`} className="px-2 text-slate-400 select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                'h-8 min-w-[32px] px-2 text-xs font-medium rounded-md transition-colors select-none',
                currentPage === p
                  ? 'bg-accent text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              )}
              aria-current={currentPage === p ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
          className="h-8 w-8 p-0"
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}

