export function RankList({ items, metric, format }: { items: any[]; metric: "totalVendas" | "totalQtd"; format: (v: number) => string }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={it.nome} className="flex items-center gap-2 text-xs">
          <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
            i === 0
              ? "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
              : "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
          }`}>
            {i + 1}
          </span>
          <span className="flex-1 truncate text-slate-700 dark:text-slate-300">{it.nome}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{format(it[metric])}</span>
        </div>
      ))}
    </div>
  )
}
