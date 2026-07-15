"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DndContext, DragOverlay, useDraggable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { useStatuses } from "@/hooks/use-statuses"
import { DroppableColumn, KanbanSkeleton } from "./kanban-column"

interface PropostaCard {
  id: number
  titulo: string
  empresaNome: string | null
  valor: string | number | null
  status: string
}

const DEFAULT_STATUSES = [
  { nome: "ENVIADA", rotulo: "Enviada", cor: "#3b82f6", ativo: true },
  { nome: "ACEITA", rotulo: "Aceita", cor: "#22c55e", ativo: true },
  { nome: "RECUSADA", rotulo: "Recusada", cor: "#ef4444", ativo: true },
  { nome: "REVISAO", rotulo: "Em Revisão", cor: "#f59e0b", ativo: true },
]

function formatar(valor: string | number | null | undefined) {
  if (valor == null) return null
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor))
}

function DraggableCard({ proposta }: { proposta: PropostaCard }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `prop-${proposta.id}`,
    data: { proposta },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined

  const handleClick = () => {
    router.push(`/comercial/crm/propostas/${proposta.id}`)
  }

  const valorFormatado = formatar(proposta.valor)

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
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
        {proposta.titulo}
      </p>
      {proposta.empresaNome && (
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{proposta.empresaNome}</p>
      )}
      {valorFormatado && (
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
          {valorFormatado}
        </p>
      )}
    </div>
  )
}

export default function PropostasKanban({ propostas }: { propostas: PropostaCard[] }) {
  const { statuses, loading: statusLoading } = useStatuses("PROPOSTA")
  const [activeCard, setActiveCard] = useState<PropostaCard | null>(null)
  const [cards, setCards] = useState<PropostaCard[]>(propostas || [])

  useEffect(() => { setCards(propostas || []) }, [propostas])

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
      cards: cards.filter(p => p.status === col.nome),
    }))

  const handleDragStart = (event: any) => {
    const card = event.active.data.current?.proposta
    if (card) setActiveCard(card)
  }

  const handleDragEnd = async (event: any) => {
    setActiveCard(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    const proposta = active.data.current?.proposta as PropostaCard | undefined
    if (!proposta) return

    const novoStatus = over.id as string
    if (proposta.status === novoStatus) return

    const statusAntigo = proposta.status

    setCards(prev =>
      prev.map(p => p.id === proposta.id ? { ...p, status: novoStatus } : p)
    )

    try {
      const res = await fetch(`/api/crm/propostas/${proposta.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao alterar status")
      }
      toast.success(`Proposta movida para ${getLabel(novoStatus)}`)
    } catch (err: any) {
      setCards(prev =>
        prev.map(p => p.id === proposta.id ? { ...p, status: statusAntigo } : p)
      )
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
                <DraggableCard key={`prop-${card.id}`} proposta={card} />
              ))}
            </DroppableColumn>
          ))}
        </div>

        {activeCard && (
          <DragOverlay>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-400 shadow-xl p-3 w-72 opacity-90">
              <p className="text-sm font-medium text-slate-900">{activeCard.titulo}</p>
              {activeCard.empresaNome && <p className="text-xs text-slate-500 mt-0.5">{activeCard.empresaNome}</p>}
            </div>
          </DragOverlay>
        )}
      </DndContext>
    </div>
  )
}
