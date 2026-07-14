"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DndContext, DragOverlay, useDraggable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { useStatuses } from "@/hooks/use-statuses"
import { DroppableColumn, KanbanSkeleton } from "./kanban-column"

interface LeadCard {
  id: number
  nome: string
  email: string | null
  celular: string | null
  empresaNome: string | null
  score: number | null
  origem: string
  status: string
}

const ORIGEM_LABELS: Record<string, string> = {
  SITE: "Site",
  INDICACAO: "Indicação",
  EVENTO: "Evento",
  PROSPECCAO: "Prospecção",
  LIGACAO: "Ligação",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  OUTRO: "Outro",
}

const DEFAULT_STATUSES = [
  { nome: "NOVO", rotulo: "Novo", cor: "#3b82f6", ativo: true },
  { nome: "CONTATADO", rotulo: "Contatado", cor: "#f59e0b", ativo: true },
  { nome: "QUALIFICADO", rotulo: "Qualificado", cor: "#10b981", ativo: true },
  { nome: "CONVERTIDO", rotulo: "Convertido", cor: "#22c55e", ativo: true },
  { nome: "PERDIDO", rotulo: "Perdido", cor: "#ef4444", ativo: true },
]

function DraggableCard({ lead }: { lead: LeadCard }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lead-${lead.id}`,
    data: { lead },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined

  const handleClick = () => {
    router.push(`/comercial/crm/leads/${lead.id}`)
  }

  function getScoreColor(score: number | null) {
    if (score == null) return "text-slate-400"
    if (score >= 70) return "text-green-600 dark:text-green-400"
    if (score >= 40) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      onClick={handleClick}
      className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug line-clamp-1">
          {lead.nome}
        </span>
        {lead.score != null && (
          <span className={`text-[10px] font-bold shrink-0 ${getScoreColor(lead.score)}`}>
            {lead.score}%
          </span>
        )}
      </div>
      {lead.empresaNome && (
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{lead.empresaNome}</p>
      )}
      <div className="flex items-center gap-2 mt-1.5">
        {lead.email && (
          <p className="text-[10px] text-slate-400 truncate">{lead.email}</p>
        )}
        <span className="text-[10px] text-slate-400 ml-auto">{ORIGEM_LABELS[lead.origem] || lead.origem}</span>
      </div>
    </div>
  )
}

export default function LeadsKanban({ leads }: { leads: LeadCard[] }) {
  const { statuses, loading: statusLoading } = useStatuses("LEAD")
  const [activeCard, setActiveCard] = useState<LeadCard | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const hasStatuses = statuses.length > 0
  const effectiveStatuses = hasStatuses ? statuses : DEFAULT_STATUSES
  const effectiveLoading = statusLoading && !hasStatuses

  const getLabel = useCallback((nome: string) => {
    if (hasStatuses) {
      const s = statuses.find(s => s.nome === nome)
      return s?.rotulo || nome
    }
    return DEFAULT_STATUSES.find(s => s.nome === nome)?.rotulo || nome
  }, [hasStatuses, statuses])

  const getColor = useCallback((nome: string) => {
    if (hasStatuses) {
      const s = statuses.find(s => s.nome === nome)
      return s?.cor || "#94a3b8"
    }
    return DEFAULT_STATUSES.find(s => s.nome === nome)?.cor || "#94a3b8"
  }, [hasStatuses, statuses])

  const colunas = effectiveStatuses
    .filter(s => s.ativo !== false)
    .map(col => ({
      ...col,
      cards: leads.filter(l => l.status === col.nome),
    }))

  const handleDragStart = (event: any) => {
    const card = event.active.data.current?.lead
    if (card) setActiveCard(card)
  }

  const handleDragEnd = async (event: any) => {
    setActiveCard(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    const lead = active.data.current?.lead as LeadCard | undefined
    if (!lead) return

    const novoStatus = over.id as string
    if (lead.status === novoStatus) return

    try {
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao alterar status")
      }
      toast.success(`Lead movido para ${getLabel(novoStatus)}`)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (effectiveLoading) {
    return <KanbanSkeleton />
  }

  return (
    <div className="flex flex-col h-[calc(100vh-280px)]">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto pb-2">
          {colunas.map(col => (
            <DroppableColumn key={col.nome} id={col.nome} rotulo={col.rotulo || col.nome} cor={col.cor} count={col.cards.length}>
              {col.cards.map(card => (
                <DraggableCard key={`lead-${card.id}`} lead={card} />
              ))}
            </DroppableColumn>
          ))}
        </div>

        {activeCard && (
          <DragOverlay>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-400 shadow-xl p-3 w-72 opacity-90">
              <p className="text-sm font-medium text-slate-900">{activeCard.nome}</p>
              {activeCard.empresaNome && <p className="text-xs text-slate-500 mt-0.5">{activeCard.empresaNome}</p>}
            </div>
          </DragOverlay>
        )}
      </DndContext>
    </div>
  )
}
