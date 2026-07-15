"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DndContext, DragOverlay, useDraggable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { DroppableColumn, KanbanSkeleton } from "./kanban-column"

interface RequisicaoCard {
  id: number
  requisitanteNome: string | null
  status: string
  totalCortes: number
  quantidadeTotal: string
  createdAt: string | null
}

const STATUS_CONFIG: Record<string, { rotulo: string; cor: string }> = {
  SOLICITADO: { rotulo: "Solicitado", cor: "#f59e0b" },
  PROCESSANDO: { rotulo: "Processando", cor: "#6366f1" },
  ATENDIDO: { rotulo: "Atendido", cor: "#22c55e" },
}

function DraggableCard({ item }: { item: RequisicaoCard }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `req-${item.id}`,
    data: { item },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      onClick={() => router.push(`/comercial/requisicoes-corte/${item.id}`)}
      className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
        #{item.id}
      </p>
      <p className="text-xs text-slate-500 mt-0.5 truncate">
        {item.requisitanteNome || "—"}
      </p>
      <p className="text-xs text-slate-500">
        {item.totalCortes ?? 0} corte(s) · {item.quantidadeTotal ?? 0} m
      </p>
      {item.createdAt && (
        <p className="text-[10px] text-slate-400 mt-1">
          {new Date(item.createdAt).toLocaleDateString("pt-BR")}
        </p>
      )}
    </div>
  )
}

export default function RequisicoesCorteKanban({ data }: { data: RequisicaoCard[] }) {
  const [activeCard, setActiveCard] = useState<RequisicaoCard | null>(null)
  const [cards, setCards] = useState<RequisicaoCard[]>(data || [])

  useEffect(() => { setCards(data || []) }, [data])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const colunas = ["SOLICITADO", "PROCESSANDO", "ATENDIDO"].map(status => ({
    ...STATUS_CONFIG[status],
    nome: status,
    cards: cards.filter(c => c.status === status),
  }))

  const handleDragStart = (event: any) => {
    const card = event.active.data.current?.item
    if (card) setActiveCard(card)
  }

  const handleDragEnd = async (event: any) => {
    setActiveCard(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    const item = active.data.current?.item as RequisicaoCard | undefined
    if (!item) return

    const novoStatus = over.id as string
    if (item.status === novoStatus) return

    const statusAntigo = item.status

    setCards(prev =>
      prev.map(c => c.id === item.id ? { ...c, status: novoStatus } : c)
    )

    try {
      const res = await fetch(`/api/comercial/requisicoes-corte/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao alterar status")
      }
      toast.success(`Requisição #${item.id} movida para ${STATUS_CONFIG[novoStatus]?.rotulo || novoStatus}`)
    } catch (err: any) {
      setCards(prev =>
        prev.map(c => c.id === item.id ? { ...c, status: statusAntigo } : c)
      )
      toast.error(err.message)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-280px)]">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto pb-2">
          {colunas.map(col => (
            <DroppableColumn key={col.nome} id={col.nome} rotulo={col.rotulo} cor={col.cor} count={col.cards.length}>
              {col.cards.map(card => (
                <DraggableCard key={`req-${card.id}`} item={card} />
              ))}
            </DroppableColumn>
          ))}
        </div>

        {activeCard && (
          <DragOverlay>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-400 shadow-xl p-3 w-72 opacity-90">
              <p className="text-sm font-bold text-slate-900">#{activeCard.id}</p>
              <p className="text-xs text-slate-500">{activeCard.requisitanteNome}</p>
            </div>
          </DragOverlay>
        )}
      </DndContext>
    </div>
  )
}
