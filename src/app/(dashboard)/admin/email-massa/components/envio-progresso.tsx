import { Loader2 } from "lucide-react"
import type { Disparo } from "../types"

export function EnvioProgresso({ progresso }: { progresso: Disparo | null }) {
  if (!progresso || (progresso.status !== "fila" && progresso.status !== "enviando")) return null

  const total = progresso.total || 0
  const processados = (progresso.enviados || 0) + (progresso.falhas || 0)
  const perc = total > 0 ? Math.round((processados / total) * 100) : 0

  return (
    <section className="flex flex-col space-y-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Envio em andamento
        </h2>
        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{perc}%</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden" role="progressbar" aria-valuenow={perc} aria-valuemin={0} aria-valuemax={100}>
        <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${perc}%` }} />
      </div>
      <p className="text-xs text-blue-700 dark:text-blue-300">
        {processados} de {total} processados &middot; {progresso.enviados} enviados &middot; {progresso.falhas} falhas &middot; {progresso.pendentes} na fila
      </p>
    </section>
  )
}
