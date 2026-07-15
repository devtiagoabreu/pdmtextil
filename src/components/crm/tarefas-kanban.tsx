"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DndContext, DragOverlay, useDraggable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Loader2 } from "lucide-react"
import { useStatuses } from "@/hooks/use-statuses"
import { DroppableColumn, KanbanSkeleton } from "./kanban-column"

interface TarefaCard {
  id: number
  titulo: string
  descricao: string | null
  tipo: string
  status: string
  dataPrevista: string | null
  empresaNome: string | null
}

const TIPO_LABELS: Record<string, string> = {
  LIGACAO: "Ligação",
  REUNIAO: "Reunião",
  PROPOSTA: "Proposta",
  TAREFA: "Tarefa",
}

const TIPO_CORES: Record<string, string> = {
  LIGACAO: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  REUNIAO: "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400",
  PROPOSTA: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
  TAREFA: "text-slate-600 bg-slate-50 dark:bg-slate-950/50 dark:text-slate-400",
}

const DEFAULT_STATUSES = [
  { nome: "PENDENTE", rotulo: "Pendente", cor: "#f59e0b", ativo: true },
  { nome: "CONCLUIDO", rotulo: "Concluído", cor: "#22c55e", ativo: true },
]

function formatarData(data: string | null) {
  if (!data) return null
  return new Date(data + "T12:00:00").toLocaleDateString("pt-BR")
}

function DraggableCard({ tarefa }: { tarefa: TarefaCard }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tar-${tarefa.id}`,
    data: { tarefa },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined

  const handleClick = () => {
    router.push(`/comercial/crm/tarefas/${tarefa.id}`)
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
        <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TIPO_CORES[tarefa.tipo] || ""}`}>
          {TIPO_LABELS[tarefa.tipo] || tarefa.tipo}
        </span>
        {tarefa.dataPrevista && (
          <span className="text-[10px] text-slate-400">{formatarData(tarefa.dataPrevista)}</span>
        )}
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1 leading-snug line-clamp-2">
        {tarefa.titulo}
      </p>
      {tarefa.descricao && (
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{tarefa.descricao}</p>
      )}
      {tarefa.empresaNome && (
        <p className="text-xs text-slate-400 mt-1">{tarefa.empresaNome}</p>
      )}
    </div>
  )
}

export default function TarefasKanban({ tarefas }: { tarefas: TarefaCard[] }) {
  const { statuses, loading: statusLoading } = useStatuses("TAREFA")
  const [activeCard, setActiveCard] = useState<TarefaCard | null>(null)
  const [cards, setCards] = useState<TarefaCard[]>(tarefas || [])

  useEffect(() => { setCards(tarefas || []) }, [tarefas])

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
      cards: cards.filter(t => t.status === col.nome),
    }))

  const handleDragStart = (event: any) => {
    const card = event.active.data.current?.tarefa
    if (card) setActiveCard(card)
  }

  const handleDragEnd = async (event: any) => {
    setActiveCard(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    const tarefa = active.data.current?.tarefa as TarefaCard | undefined
    if (!tarefa) return

    const novoStatus = over.id as string
    if (tarefa.status === novoStatus) return

    const statusAntigo = tarefa.status

    setCards(prev =>
      prev.map(t => t.id === tarefa.id ? { ...t, status: novoStatus } : t)
    )

    try {
      const res = await fetch(`/api/crm/tarefas/${tarefa.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao alterar status")
      }
      toast.success(`Tarefa movida para ${getLabel(novoStatus)}`)
    } catch (err: any) {
      setCards(prev =>
        prev.map(t => t.id === tarefa.id ? { ...t, status: statusAntigo } : t)
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
                <DraggableCard key={`tar-${card.id}`} tarefa={card} />
              ))}
            </DroppableColumn>
          ))}
        </div>

        {activeCard && (
          <DragOverlay>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-400 shadow-xl p-3 w-72 opacity-90">
              <p className="text-sm font-medium text-slate-900">{activeCard.titulo}</p>
            </div>
          </DragOverlay>
        )}
      </DndContext>
    </div>
  )
}
