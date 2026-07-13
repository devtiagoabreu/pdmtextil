"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Loader2 } from "lucide-react"
import { useStatuses } from "@/hooks/use-statuses"

interface VisitaCard {
  id: number
  dataVisita: string
  tipo: string
  status: string
  empresaNome: string | null
  oportunidadeTitulo: string | null
  criadoPorNome: string | null
}

const TIPO_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  VIDEO: "Vídeo",
  TELEFONE: "Telefone",
}

function formatarData(data: string | null) {
  if (!data) return "—"
  return new Date(data + "T12:00:00").toLocaleDateString("pt-BR")
}

function isFutura(data: string | null) {
  if (!data) return false
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const visita = new Date(data + "T12:00:00")
  return visita > hoje
}

function DroppableColumn({ id, children, rotulo, cor, count }: { id: string; children: React.ReactNode; rotulo: string; cor: string | null; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full w-72 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors shrink-0 ${
        isOver ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: cor || "#94a3b8" }}
        />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{rotulo}</span>
        <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="flex-1 min-h-0 p-2 space-y-2 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

function DraggableCard({ visita }: { visita: VisitaCard }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `vis-${visita.id}`,
    data: { visita },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined

  const handleClick = () => {
    router.push(`/comercial/crm/visitas/${visita.id}`)
  }

  const future = isFutura(visita.dataVisita)

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
        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${future ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"}`}>
          {formatarData(visita.dataVisita)}
        </span>
        <span className="text-[10px] text-slate-400">{TIPO_LABELS[visita.tipo] || visita.tipo}</span>
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1 leading-snug line-clamp-2">
        {visita.empresaNome || "Sem pessoa"}
      </p>
      {visita.oportunidadeTitulo && (
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{visita.oportunidadeTitulo}</p>
      )}
      <p className="text-xs text-slate-400 mt-1">{visita.criadoPorNome || ""}</p>
    </div>
  )
}

export default function VisitasKanban({ visitas }: { visitas: VisitaCard[] }) {
  const { statuses, loading: statusLoading, getLabel } = useStatuses("VISITA")
  const [activeCard, setActiveCard] = useState<VisitaCard | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const colunas = statuses
    .filter(s => s.ativo !== false)
    .map(col => ({
      ...col,
      cards: visitas.filter(v => v.status === col.nome),
    }))

  const handleDragStart = (event: any) => {
    const card = event.active.data.current?.visita
    if (card) setActiveCard(card)
  }

  const handleDragEnd = async (event: any) => {
    setActiveCard(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    const visita = active.data.current?.visita as VisitaCard | undefined
    if (!visita) return

    const novoStatus = over.id as string
    if (visita.status === novoStatus) return

    const statusAntigo = visita.status

    try {
      const res = await fetch(`/api/crm/visitas/${visita.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao alterar status")
      }
      toast.success(`Visita movida para ${getLabel(novoStatus)}`)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (statusLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-280px)]">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto pb-2">
          {colunas.map(col => (
            <DroppableColumn key={col.nome} id={col.nome} rotulo={col.rotulo || col.nome} cor={col.cor} count={col.cards.length}>
              {col.cards.map(card => (
                <DraggableCard key={`vis-${card.id}`} visita={card} />
              ))}
            </DroppableColumn>
          ))}
        </div>

        {activeCard && (
          <DragOverlay>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-400 shadow-xl p-3 w-72 opacity-90">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                  {formatarData(activeCard.dataVisita)}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-900 mt-1">{activeCard.empresaNome || "Sem empresa"}</p>
            </div>
          </DragOverlay>
        )}
      </DndContext>
    </div>
  )
}
