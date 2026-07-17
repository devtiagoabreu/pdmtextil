function Pulse({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className ?? ""}`} />
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <Pulse className="h-8 w-48" />
        <Pulse className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
          >
            <Pulse className="h-4 w-24" />
            <Pulse className="h-8 w-16" />
            <Pulse className="h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="space-y-3">
          <Pulse className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Pulse key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
