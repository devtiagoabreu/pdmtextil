import { MessageSquare } from "lucide-react"
import type { Solicitacao } from "./types"

export function DragOverlayCard({ card }: { card: Solicitacao }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-400 shadow-xl p-3 w-72 opacity-90">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">#{card.id}</span>
        <div className="flex items-center gap-1">
          {card.chatExists && <MessageSquare size={11} className="text-blue-500" />}
          <span className="text-[10px] text-slate-400">{card.solicitanteNome}</span>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">{card.cliente}</p>
      {card.projeto && (
        <p className="text-xs text-slate-500 mt-0.5">{card.projeto}</p>
      )}
      {card.produtoCodigoPdm && (
        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-500">
          <span className="font-medium">{card.produtoCodigoPdm}</span>
          {card.produtoIdIntegracao && (
            <span className="text-slate-400">({card.produtoIdIntegracao})</span>
          )}
          {card.produtoAmostrasCount !== undefined && card.produtoAmostrasCount > 0 && (
            <span className="ml-auto text-blue-500">{card.produtoAmostrasCount} amostra{card.produtoAmostrasCount > 1 ? "s" : ""}</span>
          )}
        </div>
      )}
    </div>
  )
}
