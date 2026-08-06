"use client"

interface Props {
  dataInicial: string
  dataFinal: string
  onApplyPeriod: (de: string | null, ate: string | null) => void
}

const toInputDate = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const PRESETS = [
  {
    label: "Hoje",
    range: () => {
      const now = new Date()
      return { de: toInputDate(now), ate: toInputDate(now) }
    },
  },
  {
    label: "Ontem",
    range: () => {
      const ontem = new Date()
      ontem.setDate(ontem.getDate() - 1)
      return { de: toInputDate(ontem), ate: toInputDate(ontem) }
    },
  },
  {
    label: "Semana",
    range: () => {
      const now = new Date()
      const de = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
      return { de: toInputDate(de), ate: toInputDate(now) }
    },
  },
  {
    label: "Quinzena",
    range: () => {
      const now = new Date()
      const de = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15)
      return { de: toInputDate(de), ate: toInputDate(now) }
    },
  },
  {
    label: "Mês atual",
    range: () => {
      const now = new Date()
      const de = new Date(now.getFullYear(), now.getMonth(), 1)
      return { de: toInputDate(de), ate: toInputDate(now) }
    },
  },
  {
    label: "Mês passado",
    range: () => {
      const now = new Date()
      const de = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const ate = new Date(now.getFullYear(), now.getMonth(), 0)
      return { de: toInputDate(de), ate: toInputDate(ate) }
    },
  },
  {
    label: "Trimestre",
    range: () => {
      const now = new Date()
      const de = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
      return { de: toInputDate(de), ate: toInputDate(now) }
    },
  },
  {
    label: "Semestre",
    range: () => {
      const now = new Date()
      const de = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      return { de: toInputDate(de), ate: toInputDate(now) }
    },
  },
  {
    label: "12 meses",
    range: () => {
      const now = new Date()
      const de = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate())
      return { de: toInputDate(de), ate: toInputDate(now) }
    },
  },
]

export function PeriodBar({ dataInicial, dataFinal, onApplyPeriod }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mr-1">Período:</span>
        <input
          type="date"
          value={dataInicial}
          onChange={e => onApplyPeriod(e.target.value || null, dataFinal || null)}
          className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <span className="text-sm text-slate-500">até</span>
        <input
          type="date"
          value={dataFinal}
          onChange={e => onApplyPeriod(dataInicial || null, e.target.value || null)}
          className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {(dataInicial || dataFinal) && (
          <button
            onClick={() => onApplyPeriod(null, null)}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Limpar
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => {
              const r = p.range()
              onApplyPeriod(r.de, r.ate)
            }}
            className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {p.label}
          </button>
        ))}
        {(dataInicial || dataFinal) && (
          <span className="text-xs text-slate-400 ml-auto">
            Análise: {dataInicial || "início"} até {dataFinal || "hoje"}
          </span>
        )}
      </div>
    </div>
  )
}
