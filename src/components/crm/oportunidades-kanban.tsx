"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DndContext, DragOverlay, useDraggable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { X } from "lucide-react"
import { useStatuses } from "@/hooks/use-statuses"
import { DroppableColumn, KanbanSkeleton } from "./kanban-column"

interface OportunidadeCard {
  id: number
  titulo: string
  valorEstimado: string | null
  empresaNome: string | null
  responsavelNome: string | null
  status: string
}

const DEFAULT_STATUSES = [
  { nome: "NOVO", rotulo: "Novo", cor: "#3b82f6", ativo: true },
  { nome: "QUALIFICACAO", rotulo: "Qualificação", cor: "#a855f7", ativo: true },
  { nome: "PROPOSTA", rotulo: "Proposta", cor: "#eab308", ativo: true },
  { nome: "NEGOCIACAO", rotulo: "Negociação", cor: "#f97316", ativo: true },
  { nome: "FECHADO_GANHO", rotulo: "Ganho", cor: "#10b981", ativo: true },
  { nome: "FECHADO_PERDIDO", rotulo: "Perdido", cor: "#ef4444", ativo: true },
]

function formatar(valor: string | null | undefined) {
  if (!valor) return null
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor))
}

function DraggableCard({ oportunidade }: { oportunidade: OportunidadeCard }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `op-${oportunidade.id}`,
    data: { oportunidade },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined

  const handleClick = () => {
    router.push(`/comercial/crm/oportunidades/${oportunidade.id}`)
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
        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          #{oportunidade.id}
        </span>
        <span className="text-[10px] text-slate-400">{oportunidade.responsavelNome || ""}</span>
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1 leading-snug line-clamp-2">
        {oportunidade.titulo}
      </p>
      {oportunidade.empresaNome && (
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{oportunidade.empresaNome}</p>
      )}
      {oportunidade.valorEstimado && (
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
          {formatar(oportunidade.valorEstimado)}
        </p>
      )}
    </div>
  )
}

export default function OportunidadesKanban({ oportunidades }: { oportunidades: OportunidadeCard[] }) {
  const { statuses, loading: statusLoading } = useStatuses("OPORTUNIDADE")
  const [activeCard, setActiveCard] = useState<OportunidadeCard | null>(null)
  const [data, setData] = useState<OportunidadeCard[]>(oportunidades)

  const [showMotivoPerda, setShowMotivoPerda] = useState(false)
  const [motivoPerda, setMotivoPerda] = useState("")
  const [pendingMove, setPendingMove] = useState<{ id: number; status: string; statusAntigo: string } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const hasStatuses = statuses.length > 0
  const effectiveStatuses = hasStatuses ? statuses : DEFAULT_STATUSES
  const effectiveLoading = statusLoading && !hasStatuses

  const getLabelSafe = useCallback((nome: string) => {
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
      cards: (data.length > 0 ? data : oportunidades).filter(o => o.status === col.nome),
    }))

  const handleDragStart = (event: any) => {
    const card = event.active.data.current?.oportunidade
    if (card) setActiveCard(card)
  }

  const handleDragEnd = async (event: any) => {
    setActiveCard(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    const oportunidade = active.data.current?.oportunidade as OportunidadeCard | undefined
    if (!oportunidade) return

    const novoStatus = over.id as string
    if (oportunidade.status === novoStatus) return

    const statusAntigo = oportunidade.status

    if (novoStatus === "FECHADO_PERDIDO") {
      setPendingMove({ id: oportunidade.id, status: novoStatus, statusAntigo })
      setMotivoPerda("")
      setShowMotivoPerda(true)
      setData(prev =>
        prev.map(o => o.id === oportunidade.id ? { ...o, status: novoStatus } : o)
      )
      return
    }

    setData(prev =>
      prev.map(o => o.id === oportunidade.id ? { ...o, status: novoStatus } : o)
    )

    try {
      const res = await fetch(`/api/crm/oportunidades/${oportunidade.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao alterar status")
      }
      toast.success(`Oportunidade movida para ${getLabelSafe(novoStatus)}`)
    } catch (err: any) {
      setData(prev =>
        prev.map(o => o.id === oportunidade.id ? { ...o, status: statusAntigo } : o)
      )
      toast.error(err.message)
    }
  }

  async function confirmarPerda() {
    if (!pendingMove || !motivoPerda.trim()) return

    try {
      const res = await fetch(`/api/crm/oportunidades/${pendingMove.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "FECHADO_PERDIDO", motivoPerda: motivoPerda.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Erro ao confirmar perda")
      toast.success("Oportunidade marcada como Perdida")
    } catch (err: any) {
      setData(prev =>
        prev.map(o => o.id === pendingMove.id ? { ...o, status: pendingMove.statusAntigo } : o)
      )
      toast.error(err.message)
    }
    setShowMotivoPerda(false)
    setMotivoPerda("")
    setPendingMove(null)
  }

  function cancelarPerda() {
    if (pendingMove) {
      setData(prev =>
        prev.map(o => o.id === pendingMove.id ? { ...o, status: pendingMove.statusAntigo } : o)
      )
    }
    setShowMotivoPerda(false)
    setMotivoPerda("")
    setPendingMove(null)
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
                <DraggableCard key={`op-${card.id}`} oportunidade={card} />
              ))}
            </DroppableColumn>
          ))}
        </div>

        {activeCard && (
          <DragOverlay>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-400 shadow-xl p-3 w-72 opacity-90">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">#{activeCard.id}</span>
              </div>
              <p className="text-sm font-medium text-slate-900 mt-1">{activeCard.titulo}</p>
              {activeCard.empresaNome && (
                <p className="text-xs text-slate-500 mt-0.5">{activeCard.empresaNome}</p>
              )}
            </div>
          </DragOverlay>
        )}
      </DndContext>

      {showMotivoPerda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={cancelarPerda}>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Motivo da Perda</h3>
              <button onClick={cancelarPerda} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Informe o motivo pelo qual esta oportunidade foi perdida:
            </p>
            <textarea
              value={motivoPerda}
              onChange={e => setMotivoPerda(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 min-h-[100px] resize-none"
              placeholder="Ex: Cliente optou por concorrente, orçamento acima do esperado..."
              autoFocus
            />
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={cancelarPerda} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={confirmarPerda}
                disabled={!motivoPerda.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                Confirmar Perda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
