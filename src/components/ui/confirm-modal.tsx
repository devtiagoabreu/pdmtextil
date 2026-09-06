"use client"

import { AlertTriangle, Loader2, X } from "lucide-react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

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
  const isDanger = variant === "danger"

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) onCancel() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
          data-testid="backdrop"
        />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none">
          <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-auto animate-fade-in">
            <DialogPrimitive.Close
              aria-label="Fechar"
              className="absolute right-3 top-3 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={18} />
            </DialogPrimitive.Close>

            <div className="p-6">
              <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${isDanger ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                <AlertTriangle className={isDanger ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"} size={24} />
              </div>

              <DialogPrimitive.Title className="text-center text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                {title}
              </DialogPrimitive.Title>
              <p className="text-center text-sm text-slate-600 dark:text-slate-400">{message}</p>
              {subMessage && (
                <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  {subMessage}
                </p>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
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
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}