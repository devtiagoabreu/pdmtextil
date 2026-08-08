import { Clock, Loader2 } from "lucide-react"
import type { Disparo } from "../types"

export function EnvioProgresso({ progresso }: { progresso: Disparo | null }) {
  if (!progresso || !["fila", "enviando", "pausado"].includes(progresso.status)) return null

  const total = progresso.total || 0
  const processados = (progresso.enviados || 0) + (progresso.falhas || 0)
  const perc = total > 0 ? Math.round((processados / total) * 100) : 0
  const pausado = progresso.status === "pausado"

  return (
    <section className={`flex flex-col space-y-3 p-4 rounded-lg border ${pausado ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"}`}>
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-semibold flex items-center gap-2 ${pausado ? "text-amber-800 dark:text-amber-300" : "text-blue-800 dark:text-blue-300"}`}>
          {pausado ? <Clock size={14} /> : <Loader2 size={14} className="animate-spin" />}
          {pausado ? "Envio pausado (limite diário)" : "Envio em andamento"}
        </h2>
        <span className={`text-xs font-medium ${pausado ? "text-amber-700 dark:text-amber-300" : "text-blue-700 dark:text-blue-300"}`}>{perc}%</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden" role="progressbar" aria-valuenow={perc} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-2 rounded-full transition-all ${pausado ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${perc}%` }} />
      </div>
      <p className={`text-xs ${pausado ? "text-amber-700 dark:text-amber-300" : "text-blue-700 dark:text-blue-300"}`}>
        {processados} de {total} processados &middot; {progresso.enviados} enviados &middot; {progresso.falhas} falhas &middot; {progresso.pendentes} na fila
      </p>
    </section>
  )
}
