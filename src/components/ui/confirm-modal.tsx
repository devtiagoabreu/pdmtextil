"use client"

import { X, AlertTriangle, Loader2 } from "lucide-react"

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  subMessage?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "warning"
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  subMessage,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  const isDanger = variant === "danger"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} data-testid="backdrop" />
      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4 animate-fade-in">
        <button
          onClick={onCancel}
          className="absolute right-3 top-3 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${isDanger ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
            <AlertTriangle className={isDanger ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"} size={24} />
          </div>

          <h3 className="text-center text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">{title}</h3>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">{message}</p>
          {subMessage && (
            <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              {subMessage}
            </p>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg text-white disabled:opacity-50 transition-colors flex items-center justify-center gap-2 ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Aguarde..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
