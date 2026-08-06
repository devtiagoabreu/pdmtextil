import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { Solicitacao, PilotagemAmostra } from "./types"

interface PilotagemDialogProps {
  target: Solicitacao | null
  amostras: PilotagemAmostra[]
  selecionadas: Set<string>
  setSelecionadas: (s: Set<string>) => void
  loading: boolean
  submitting: boolean
  onConfirm: () => void
  onClose: () => void
}

export function PilotagemDialog({
  target,
  amostras,
  selecionadas,
  setSelecionadas,
  loading,
  submitting,
  onConfirm,
  onClose,
}: PilotagemDialogProps) {
  return (
    <Dialog open={!!target} onOpenChange={(open: boolean) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Iniciar Pilotagem — #{target?.id} {target?.cliente}</DialogTitle>
          <DialogDescription>
            Selecione as amostras que entrarão em produção
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-72 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-slate-400" /></div>
          ) : amostras.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Nenhuma amostra disponível</p>
          ) : (
            amostras.map((a: any) => {
              const key = `${a.tipo}-${a.id}`
              const checked = selecionadas.has(key)
              return (
                <label
                  key={key}
                  className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => {
                      const next = new Set(selecionadas)
                      if (next.has(key)) next.delete(key)
                      else next.add(key)
                      setSelecionadas(next)
                    }}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{a.rotulo}</span>
                      <span className="text-[10px] uppercase text-slate-400">{a.status}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{a.descricao || "Sem descrição"}</p>
                  </div>
                </label>
              )
            })
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={selecionadas.size === 0 || submitting}
            onClick={onConfirm}
            className="inline-flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Confirmar ({selecionadas.size})
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
