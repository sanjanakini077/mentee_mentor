import React from 'react'
import { Search, X, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface FilterOption {
  key: string
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

export interface SearchFilterBarProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
  searchPlaceholder?: string
  filters?: FilterOption[]
  onResetFilters?: () => void
  resultsCount?: number
  className?: string
  actionSlot?: React.ReactNode
}

export function SearchFilterBar({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  onResetFilters,
  resultsCount,
  className,
  actionSlot,
}: SearchFilterBarProps) {
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    filters.some((f) => f.value !== '' && f.value !== 'all')

  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-md p-3 mb-4 space-y-3',
        className
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            leftIcon={<Search size={15} />}
            rightIcon={
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchChange?.('')}
                  className="hover:text-slate-600 focus:outline-none"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              ) : null
            }
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <div key={filter.key} className="relative min-w-[140px]">
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="w-full h-9 pl-3 pr-8 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer"
                aria-label={filter.label}
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
          ))}

          {hasActiveFilters && onResetFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              leftIcon={<RotateCcw size={12} />}
              className="text-slate-500 hover:text-slate-700"
            >
              Reset
            </Button>
          )}

          {actionSlot && <div className="ml-auto">{actionSlot}</div>}
        </div>
      </div>

      {resultsCount !== undefined && (
        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-100">
          <span>
            Found <strong className="text-slate-700">{resultsCount}</strong> matching record{resultsCount === 1 ? '' : 's'}
          </span>
          {hasActiveFilters && (
            <span className="text-accent font-medium">Filters active</span>
          )}
        </div>
      )}
    </div>
  )
}

