import React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  helperText?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, helperText, id, rows = 3, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          id={id}
          ref={ref}
          rows={rows}
          className={cn(
            'w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-md',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent',
            'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50',
            'transition-colors resize-y min-h-[72px]',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            className
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
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

Textarea.displayName = 'Textarea'

