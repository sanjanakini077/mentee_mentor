import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[]
  error?: string
  helperText?: string
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      options = [],
      error,
      helperText,
      placeholder,
      children,
      id,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          <select
            id={id}
            ref={ref}
            className={cn(
              'w-full h-9 pl-3 pr-8 text-sm text-slate-800 bg-white border border-slate-300 rounded-md appearance-none',
              'focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent',
              'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50',
              'transition-colors cursor-pointer',
              error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
              className
            )}
            aria-invalid={Boolean(error)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.length > 0
              ? options.map((opt) => (
                  <option
                    key={String(opt.value)}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-2.5 pointer-events-none text-slate-400">
            <ChevronDown size={14} />
          </div>
        </div>
        {error ? (
          <p id={`${id}-error`} className="mt-1 text-xs text-red-600 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${id}-helper`} className="mt-1 text-xs text-slate-500">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)

Select.displayName = 'Select'

