"use client"

import { useEffect, useState, useCallback } from "react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Loader2, Plus, X } from "lucide-react"
import { useStatuses } from "@/hooks/use-statuses"

interface OportunidadeCard {
  id: number
  titulo: string
  valorEstimado: string | null
  empresaNome: string | null
  responsavelNome: string | null
  status: string
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

  function formatar(valor: string | null | undefined) {
    if (!valor) return null
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor))
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

export default function KanbanOportunidadesPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const { statuses, loading: statusLoading, getLabel } = useStatuses("OPORTUNIDADE")
  const [oportunidades, setOportunidades] = useState<OportunidadeCard[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState<OportunidadeCard | null>(null)

  const [showMotivoPerda, setShowMotivoPerda] = useState(false)
  const [motivoPerda, setMotivoPerda] = useState("")
  const [pendingMove, setPendingMove] = useState<{ id: number; status: string; statusAntigo: string } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/crm/oportunidades")
      const data = await res.json()
      if (Array.isArray(data)) {
        setOportunidades(data.map((o: any) => ({
          id: o.id,
          titulo: o.titulo,
          valorEstimado: o.valorEstimado,
          empresaNome: o.empresaNome,
          responsavelNome: o.responsavelNome,
          status: o.status,
        })))
      }
    } catch {
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const colunas = statuses
    .filter(s => s.ativo !== false)
    .map(col => ({
      ...col,
      cards: oportunidades.filter(o => o.status === col.nome),
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
      setOportunidades(prev =>
        prev.map(o => o.id === oportunidade.id ? { ...o, status: novoStatus } : o)
      )
      return
    }

    setOportunidades(prev =>
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
      toast.success(`Oportunidade movida para ${getLabel(novoStatus)}`)
    } catch (err: any) {
      setOportunidades(prev =>
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
      setOportunidades(prev =>
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
      setOportunidades(prev =>
        prev.map(o => o.id === pendingMove.id ? { ...o, status: pendingMove.statusAntigo } : o)
      )
    }
    setShowMotivoPerda(false)
    setMotivoPerda("")
    setPendingMove(null)
  }

  if (loading || statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen animate-fade-in">
      <div className="flex items-center justify-between shrink-0 px-6 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Kanban — Oportunidades CRM{info && <InfoButton content={info} />}</h1>
          <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Arraste os cards para mover</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/comercial/crm/oportunidades" className="text-sm text-blue-600 hover:underline">
            Lista
          </Link>
          <Link
            href="/comercial/crm/oportunidades/novo"
            className="inline-flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
          >
            <Plus size={14} /> Nova Oportunidade
          </Link>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col px-6 pb-6">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto">
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
        </div>

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
