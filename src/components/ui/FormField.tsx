import React from 'react'
import { Label } from '@/components/ui/Label'
import { cn } from '@/lib/utils'

export interface FormFieldProps {
  label?: string
  required?: boolean
  description?: string
  error?: string
  helperText?: string
  htmlFor?: string
  className?: string
  children: React.ReactNode
}

export function FormField({
  label,
  required,
  description,
  error,
  helperText,
  htmlFor,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required} description={description}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  )
}

