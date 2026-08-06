import Link from "next/link"
import { useDraggable } from "@dnd-kit/core"
import { Calendar, MessageSquare, ExternalLink } from "lucide-react"
import type { Solicitacao } from "./types"

interface DraggableCardProps {
  solicitacao: Solicitacao
  onOpenChat: (s: Solicitacao) => void
  onOpenAmostras: (s: Solicitacao) => void
}

export function DraggableCard({ solicitacao, onOpenChat, onOpenAmostras }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `card-${solicitacao.id}`,
    data: { solicitacao },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined

  const prazoDate = solicitacao.prazoDesejado ? new Date(solicitacao.prazoDesejado) : null
  const hoje = new Date()
  const vencido = prazoDate && prazoDate < hoje

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/comercial/solicitacoes/${solicitacao.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          #{solicitacao.id}
          <ExternalLink size={10} />
        </Link>
        <div className="flex items-center gap-1">
          {solicitacao.chatExists && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenChat(solicitacao) }}
              title="Ver resumo do chat"
              className="text-blue-500 hover:text-blue-700 transition-colors"
            >
              <MessageSquare size={11} />
            </button>
          )}
          <span className="text-[10px] text-slate-400">{solicitacao.solicitanteNome}</span>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1 leading-snug line-clamp-2">
        {solicitacao.cliente}
      </p>
      {solicitacao.projeto && (
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{solicitacao.projeto}</p>
      )}
      {solicitacao.produtoCodigoPdm && (
        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-500">
          <span className="font-medium">{solicitacao.produtoCodigoPdm}</span>
          {solicitacao.produtoIdIntegracao && (
            <span className="text-slate-400">({solicitacao.produtoIdIntegracao})</span>
          )}
          {solicitacao.produtoAmostrasCount !== undefined && solicitacao.produtoAmostrasCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenAmostras(solicitacao) }}
              className="ml-auto text-blue-500 hover:text-blue-700 hover:underline transition-colors"
              title="Ver amostras do produto"
            >
              {solicitacao.produtoAmostrasCount} amostra{solicitacao.produtoAmostrasCount > 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}
      {prazoDate && (
        <div className={`flex items-center gap-1 mt-2 text-[10px] ${vencido ? "text-red-500" : "text-slate-400"}`}>
          <Calendar size={10} />
          <span>{prazoDate.toLocaleDateString("pt-BR")}</span>
        </div>
      )}
    </div>
  )
}
