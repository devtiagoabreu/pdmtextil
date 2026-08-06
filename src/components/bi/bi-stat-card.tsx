export function StatCard({ label, value, icon: Icon, prefix = "" }: { label: string; value: string | number; icon: any; prefix?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 card-hover">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {prefix}{typeof value === "number" ? value.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : value}
          </p>
        </div>
      </div>
    </div>
  )
}
