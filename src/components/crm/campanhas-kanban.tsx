"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DndContext, DragOverlay, useDraggable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { useStatuses } from "@/hooks/use-statuses"
import { DroppableColumn, KanbanSkeleton } from "./kanban-column"

interface CampanhaCard {
  id: number
  nome: string
  tipo: string
  status: string
  dataInicio: string | null
  leadsGerados: number | null
}

const TIPO_LABELS: Record<string, string> = {
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
  REDES: "Redes Sociais",
  EVENTO: "Evento",
}

const TIPO_CORES: Record<string, string> = {
  EMAIL: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  WHATSAPP: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
  REDES: "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400",
  EVENTO: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
}

const DEFAULT_STATUSES = [
  { nome: "ATIVA", rotulo: "Ativa", cor: "#22c55e", ativo: true },
  { nome: "PAUSADA", rotulo: "Pausada", cor: "#f59e0b", ativo: true },
  { nome: "CONCLUIDA", rotulo: "Concluída", cor: "#64748b", ativo: true },
]

function formatarData(data: string | null) {
  if (!data) return null
  return new Date(data + "T12:00:00").toLocaleDateString("pt-BR")
}

function DraggableCard({ campanha }: { campanha: CampanhaCard }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `camp-${campanha.id}`,
    data: { campanha },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined

  const handleClick = () => {
    router.push(`/comercial/crm/campanhas/${campanha.id}`)
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
        <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TIPO_CORES[campanha.tipo] || ""}`}>
          {TIPO_LABELS[campanha.tipo] || campanha.tipo}
        </span>
        {campanha.dataInicio && (
          <span className="text-[10px] text-slate-400">{formatarData(campanha.dataInicio)}</span>
        )}
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1 leading-snug line-clamp-2">
        {campanha.nome}
      </p>
      {campanha.leadsGerados != null && (
        <p className="text-xs text-slate-500 mt-1">
          {campanha.leadsGerados} lead(s) gerado(s)
        </p>
      )}
    </div>
  )
}

export default function CampanhasKanban({ campanhas }: { campanhas: CampanhaCard[] }) {
  const { statuses, loading: statusLoading } = useStatuses("CAMPANHA")
  const [activeCard, setActiveCard] = useState<CampanhaCard | null>(null)

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

  const colunas = effectiveStatuses
    .filter(s => s.ativo !== false)
    .map(col => ({
      ...col,
      cards: campanhas.filter(c => c.status === col.nome),
    }))

  const handleDragStart = (event: any) => {
    const card = event.active.data.current?.campanha
    if (card) setActiveCard(card)
  }

  const handleDragEnd = async (event: any) => {
    setActiveCard(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    const campanha = active.data.current?.campanha as CampanhaCard | undefined
    if (!campanha) return

    const novoStatus = over.id as string
    if (campanha.status === novoStatus) return

    try {
      const res = await fetch(`/api/crm/campanhas/${campanha.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao alterar status")
      }
      toast.success(`Campanha movida para ${getLabel(novoStatus)}`)
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
                <DraggableCard key={`camp-${card.id}`} campanha={card} />
              ))}
            </DroppableColumn>
          ))}
        </div>

        {activeCard && (
          <DragOverlay>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-400 shadow-xl p-3 w-72 opacity-90">
              <p className="text-sm font-medium text-slate-900">{activeCard.nome}</p>
            </div>
          </DragOverlay>
        )}
      </DndContext>
    </div>
  )
}
