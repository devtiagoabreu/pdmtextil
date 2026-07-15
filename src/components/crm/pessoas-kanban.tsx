"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DndContext, DragOverlay, useDraggable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { useStatuses } from "@/hooks/use-statuses"
import { DroppableColumn, KanbanSkeleton } from "./kanban-column"

interface PessoaCard {
  id: number
  tipoPessoa: string
  nome: string | null
  razaoSocial: string | null
  cpf: string | null
  cnpj: string | null
  segmento: string | null
  responsavelNome: string | null
  status: string
}

const DEFAULT_STATUSES = [
  { nome: "NOVO", rotulo: "Novo", cor: "#3b82f6", ativo: true },
  { nome: "QUALIFICADO", rotulo: "Qualificado", cor: "#10b981", ativo: true },
  { nome: "CONVERTIDO_CLIENTE", rotulo: "Cliente", cor: "#22c55e", ativo: true },
  { nome: "PERDIDO", rotulo: "Perdido", cor: "#ef4444", ativo: true },
  { nome: "INATIVO", rotulo: "Inativo", cor: "#94a3b8", ativo: true },
]

function formatarDocumento(pessoa: PessoaCard) {
  if (pessoa.cnpj) return `CNPJ: ${pessoa.cnpj}`
  if (pessoa.cpf) return `CPF: ${pessoa.cpf}`
  return null
}

function DraggableCard({ pessoa }: { pessoa: PessoaCard }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `pes-${pessoa.id}`,
    data: { pessoa },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined

  const handleClick = () => {
    router.push(`/comercial/crm/pessoas/${pessoa.id}`)
  }

  const nomeExibido = pessoa.nome || pessoa.razaoSocial || "Sem nome"
  const documento = formatarDocumento(pessoa)
  const tipoBadge = pessoa.tipoPessoa === "PF"
    ? "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400"
    : "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 dark:text-cyan-400"

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
        <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tipoBadge}`}>
          {pessoa.tipoPessoa}
        </span>
        {pessoa.responsavelNome && (
          <span className="text-[10px] text-slate-400">{pessoa.responsavelNome}</span>
        )}
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1 leading-snug line-clamp-2">
        {nomeExibido}
      </p>
      {documento && (
        <p className="text-xs text-slate-500 mt-0.5">{documento}</p>
      )}
      {pessoa.segmento && (
        <p className="text-xs text-slate-400 mt-1">{pessoa.segmento}</p>
      )}
    </div>
  )
}

export default function PessoasKanban({ pessoas }: { pessoas: PessoaCard[] }) {
  const { statuses, loading: statusLoading } = useStatuses("PESSOA")
  const [activeCard, setActiveCard] = useState<PessoaCard | null>(null)
  const [cards, setCards] = useState<PessoaCard[]>(pessoas || [])

  useEffect(() => { setCards(pessoas || []) }, [pessoas])

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
      cards: cards.filter(p => p.status === col.nome),
    }))

  const handleDragStart = (event: any) => {
    const card = event.active.data.current?.pessoa
    if (card) setActiveCard(card)
  }

  const handleDragEnd = async (event: any) => {
    setActiveCard(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    const pessoa = active.data.current?.pessoa as PessoaCard | undefined
    if (!pessoa) return

    const novoStatus = over.id as string
    if (pessoa.status === novoStatus) return

    const statusAntigo = pessoa.status

    setCards(prev =>
      prev.map(p => p.id === pessoa.id ? { ...p, status: novoStatus } : p)
    )

    try {
      const res = await fetch(`/api/crm/pessoas/${pessoa.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao alterar status")
      }
      toast.success(`Pessoa movida para ${getLabel(novoStatus)}`)
    } catch (err: any) {
      setCards(prev =>
        prev.map(p => p.id === pessoa.id ? { ...p, status: statusAntigo } : p)
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
                <DraggableCard key={`pes-${card.id}`} pessoa={card} />
              ))}
            </DroppableColumn>
          ))}
        </div>

        {activeCard && (
          <DragOverlay>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-400 shadow-xl p-3 w-72 opacity-90">
              <p className="text-sm font-medium text-slate-900">{activeCard.nome || activeCard.razaoSocial || "Sem nome"}</p>
            </div>
          </DragOverlay>
        )}
      </DndContext>
    </div>
  )
}
