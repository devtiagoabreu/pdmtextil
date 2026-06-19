"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Loader2, Plus, ExternalLink, Calendar, MessageSquare } from "lucide-react"
import Link from "next/link"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

const ROLES_PERMITIDOS = ["COMERCIAL", "DESENVOLVIMENTO", "QUALIDADE", "PCP", "ADMIN", "SUDO"]

interface StatusCol {
  nome: string
  rotulo: string
  cor: string | null
}

interface Solicitacao {
  id: number
  tipo: string
  status: string
  cliente: string
  projeto: string | null
  prazoDesejado: string | null
  createdAt: string
  solicitanteNome: string
  chatExists?: boolean
  produtoCodigoPdm?: string | null
  produtoIdIntegracao?: string | null
  produtoAmostrasCount?: number
}

function DroppableColumn({ id, children, rotulo, cor, count }: { id: string; children: React.ReactNode; rotulo: string; cor: string | null; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors ${
        isOver ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 dark:border-slate-800">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: cor || "#94a3b8" }}
        />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{rotulo}</span>
        <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-220px)] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

function DraggableCard({ solicitacao }: { solicitacao: Solicitacao }) {
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
            <MessageSquare size={11} className="text-blue-400" />
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
            <span className="ml-auto text-blue-500">{solicitacao.produtoAmostrasCount} amostra{solicitacao.produtoAmostrasCount > 1 ? "s" : ""}</span>
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

export default function KanbanSolicitacoesPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const router = useRouter()
  const { data: session } = useSession()
  const role = session?.user?.role as string | undefined
  const podeArrastar = role ? ROLES_PERMITIDOS.includes(role) : false

  const [statusList, setStatusList] = useState<StatusCol[]>([])
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState<Solicitacao | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [statusRes, solRes] = await Promise.all([
        fetch("/api/admin/status?tipo=SOLICITACAO_DESENVOLVIMENTO").then(r => r.json()),
        fetch("/api/solicitacoes").then(r => r.json()),
      ])
      if (Array.isArray(statusRes)) setStatusList(statusRes)
      if (Array.isArray(solRes)) setSolicitacoes(solRes)
    } catch {
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const colunas = statusList
    .filter(s => s.nome !== "REPROVADO" || true)
    .map(col => ({
      ...col,
      cards: solicitacoes.filter(s => s.status === col.nome),
    }))

  const handleDragStart = (event: any) => {
    const card = event.active.data.current?.solicitacao
    if (card) setActiveCard(card)
  }

  const handleDragEnd = async (event: any) => {
    setActiveCard(null)
    if (!podeArrastar) return

    const { active, over } = event
    if (!over || active.id === over.id) return

    const solicitacao = active.data.current?.solicitacao as Solicitacao | undefined
    if (!solicitacao) return

    const novoStatus = over.id as string
    if (solicitacao.status === novoStatus) return

    try {
      const res = await fetch(`/api/solicitacoes/${solicitacao.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao alterar status")
      }
      toast.success(`Solicitação #${solicitacao.id} movida para ${statusList.find(s => s.nome === novoStatus)?.rotulo || novoStatus}`)
      carregar()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Kanban — Solicitações{info && <InfoButton content={info} />}</h1>
          {podeArrastar && (
            <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Arraste os cards para mover</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/comercial/solicitacoes" className="text-sm text-blue-600 hover:underline">
            Lista
          </Link>
          <Link href="/comercial/solicitacoes/nova" className="inline-flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
            <Plus size={14} /> Nova
          </Link>
        </div>
      </div>

      {!podeArrastar && (
        <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-3 py-2 rounded-lg">
          Seu perfil não tem permissão para mover solicitações entre colunas.
        </p>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 pb-4 overflow-x-auto">
          {colunas.map(col => (
            <DroppableColumn key={col.nome} id={col.nome} rotulo={col.rotulo} cor={col.cor} count={col.cards.length}>
              {col.cards.map(card => (
                <DraggableCard key={card.id} solicitacao={card} />
              ))}
            </DroppableColumn>
          ))}
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-400 shadow-xl p-3 w-72 opacity-90">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">#{activeCard.id}</span>
                <div className="flex items-center gap-1">
                  {activeCard.chatExists && <MessageSquare size={11} className="text-blue-400" />}
                  <span className="text-[10px] text-slate-400">{activeCard.solicitanteNome}</span>
                </div>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">{activeCard.cliente}</p>
              {activeCard.projeto && (
                <p className="text-xs text-slate-500 mt-0.5">{activeCard.projeto}</p>
              )}
              {activeCard.produtoCodigoPdm && (
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-500">
                  <span className="font-medium">{activeCard.produtoCodigoPdm}</span>
                  {activeCard.produtoIdIntegracao && (
                    <span className="text-slate-400">({activeCard.produtoIdIntegracao})</span>
                  )}
                  {activeCard.produtoAmostrasCount !== undefined && activeCard.produtoAmostrasCount > 0 && (
                    <span className="ml-auto text-blue-500">{activeCard.produtoAmostrasCount} amostra{activeCard.produtoAmostrasCount > 1 ? "s" : ""}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
