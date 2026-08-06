import { Globe, Loader2, Play, Edit3, Trash2, Check, X, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TIPO_AUTH_LABEL, TIPO_AUTH_ICON } from "./constants"
import type { Integracao } from "./types"

interface IntegracaoCardProps {
  item: Integracao
  testingId: number | null
  onTest: (id: number) => void
  onEdit: (item: Integracao) => void
  onToggle: (item: Integracao) => void
  onDelete: (id: number) => void
}

export function IntegracaoCard({ item, testingId, onTest, onEdit, onToggle, onDelete }: IntegracaoCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className={`shrink-0 inline-flex p-2.5 rounded-lg ${TIPO_AUTH_ICON[item.tipoAuth]}`}>
            <Key size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{item.nome}</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                {TIPO_AUTH_LABEL[item.tipoAuth]}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${item.ativo ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                {item.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-mono truncate mt-1">{item.baseUrl}</p>
            {item.telas && item.telas.length > 0 && (
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {item.telas.map((t: any) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 uppercase">{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" variant="ghost" onClick={() => onTest(item.id)} disabled={testingId === item.id} className="gap-1 text-blue-600">
            {testingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(item)} className="gap-1">
            <Edit3 size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onToggle(item)} className="gap-1">
            {item.ativo ? <X size={14} className="text-amber-500" /> : <Check size={14} className="text-green-500" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(item.id)} className="gap-1 text-red-500">
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function IntegracaoEmpty() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
      <Globe size={40} className="mx-auto text-slate-300 mb-3" />
      <p className="text-sm text-slate-500">Nenhuma integração cadastrada</p>
    </div>
  )
}
