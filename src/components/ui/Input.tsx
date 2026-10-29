import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 pointer-events-none flex items-center justify-center text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={id}
            ref={ref}
            className={cn(
              'w-full h-9 text-sm text-slate-800 bg-white border border-slate-300 rounded-md',
              'placeholder:text-slate-400',
              'focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent',
              'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50',
              'transition-colors',
              leftIcon ? 'pl-9 pr-3' : 'px-3',
              rightIcon ? 'pr-9' : undefined,
              error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
              className
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error
                ? `${id}-error`
                : helperText
                ? `${id}-helper`
                : undefined
            }
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center justify-center text-slate-400">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input'
