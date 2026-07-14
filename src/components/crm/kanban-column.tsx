"use client"

import { useDroppable } from "@dnd-kit/core"

export function DroppableColumn({ id, children, rotulo, cor, count }: { id: string; children: React.ReactNode; rotulo: string; cor: string | null; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full w-72 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors shrink-0 ${
        isOver ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: cor || "#94a3b8" }}
        />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{rotulo}</span>
        <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="flex-1 min-h-0 p-2 space-y-2 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 h-[calc(100vh-280px)]">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-72 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 animate-pulse">
          <div className="h-10 border-b border-slate-200 dark:border-slate-800" />
          <div className="p-3 space-y-3">
            <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
