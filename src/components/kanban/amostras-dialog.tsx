import Link from "next/link"
import { Loader2, FileText, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { Solicitacao, AmostraItem } from "./types"

interface AmostrasDialogProps {
  target: Solicitacao | null
  data: AmostraItem[]
  loading: boolean
  onClose: () => void
}

export function AmostrasDialog({ target, data, loading, onClose }: AmostrasDialogProps) {
  return (
    <Dialog open={!!target} onOpenChange={(open: boolean) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Amostras — {target?.produtoCodigoPdm || `#${target?.id}`}</DialogTitle>
          <DialogDescription>
            {data.length} amostra{data.length !== 1 ? "s" : ""} encontrada{data.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-72 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-slate-400" /></div>
          ) : data.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Nenhuma amostra encontrada</p>
          ) : (
            data.map((a: any) => (
              <Link
                key={a.scrollId ?? a.id ?? a.tipo}
                href={target?.produtoId ? `/cadastros/produto-cru/${target.produtoId}?tab=amostras&amostraId=${encodeURIComponent(a.scrollId)}` : "#"}
                onClick={onClose}
                className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors group"
              >
                <FileText size={14} className="text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{a.tipo}</span>
                    <span className="text-[10px] uppercase text-slate-400">{a.status}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{a.descricao || "Sem descrição"}</p>
                </div>
                <ExternalLink size={12} className="text-slate-300 group-hover:text-blue-500 shrink-0" />
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
