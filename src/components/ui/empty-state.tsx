import type { LucideIcon } from "lucide-react"
import { Inbox } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  message: string
  subMessage?: string
  children?: React.ReactNode
}

export function EmptyState({ icon: Icon = Inbox, message, subMessage, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Icon className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{message}</p>
      {subMessage && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subMessage}</p>
      )}
      {children}
    </div>
  )
}
