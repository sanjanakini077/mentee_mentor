'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  title?: string
  message: string
  type?: ToastType
  duration?: number
}

interface ToastContextValue {
  toast: (options: Omit<ToastItem, 'id'>) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-emerald-600" />,
  error: <AlertCircle size={16} className="text-rose-600" />,
  warning: <AlertTriangle size={16} className="text-amber-600" />,
  info: <Info size={16} className="text-blue-600" />,
}

const toastBorders: Record<ToastType, string> = {
  success: 'border-l-4 border-l-emerald-500 border-slate-200',
  error: 'border-l-4 border-l-rose-500 border-slate-200',
  warning: 'border-l-4 border-l-amber-500 border-slate-200',
  info: 'border-l-4 border-l-blue-500 border-slate-200',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    ({ title, message, type = 'info', duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newItem: ToastItem = { id, title, message, type, duration }

      setToasts((prev) => [...prev, newItem])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const success = useCallback(
    (message: string, title?: string) => toast({ message, title, type: 'success' }),
    [toast]
  )
  const error = useCallback(
    (message: string, title?: string) => toast({ message, title, type: 'error' }),
    [toast]
  )
  const info = useCallback(
    (message: string, title?: string) => toast({ message, title, type: 'info' }),
    [toast]
  )
  const warning = useCallback(
    (message: string, title?: string) => toast({ message, title, type: 'warning' }),
    [toast]
  )

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-3.5 bg-white border rounded-md shadow-md animate-in slide-in-from-bottom-3 duration-200',
              toastBorders[item.type || 'info']
            )}
            role="status"
          >
            <div className="shrink-0 mt-0.5">{toastIcons[item.type || 'info']}</div>
            <div className="flex-1 min-w-0">
              {item.title && (
                <p className="text-xs font-semibold text-slate-800">{item.title}</p>
              )}
              <p className="text-xs text-slate-600 leading-snug">{item.message}</p>
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="text-slate-400 hover:text-slate-600 rounded p-0.5 hover:bg-slate-100 transition-colors"
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

