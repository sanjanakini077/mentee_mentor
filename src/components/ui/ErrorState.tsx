import React from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'p-5 rounded-md border border-rose-200 bg-rose-50/80 text-rose-900',
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
          <AlertCircle size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
          <p className="text-xs text-rose-700 mt-1 leading-relaxed">{message}</p>
          {onRetry && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                leftIcon={<RotateCcw size={12} />}
                className="bg-white border-rose-300 text-rose-800 hover:bg-rose-50"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

