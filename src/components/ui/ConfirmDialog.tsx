'use client'

import React from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}: ConfirmDialogProps) {
  const isDestructive = variant === 'danger'

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            isDestructive
              ? 'bg-rose-100 text-rose-600'
              : 'bg-blue-100 text-blue-600'
          }`}
        >
          {isDestructive ? <AlertTriangle size={18} /> : <Info size={18} />}
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
          <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
        </div>
      </div>
    </Dialog>
  )
}

