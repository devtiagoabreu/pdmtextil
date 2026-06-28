"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

const ROLES_PERMITIDOS = ["COMERCIAL", "DESENVOLVIMENTO", "PCP", "ADMIN", "SUDO"]

interface StatusCol {
  nome: string
  rotulo: string
  cor: string | null
}

interface RequisicaoCard {
  id: number
  titulo: string | null
  cliente: string | null
  produtoCodigo: string | null
  produtoDescricao: string | null
  status: string
  quantidade: string | null
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

function DraggableCard({ requisicao }: { requisicao: RequisicaoCard }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `req-${requisicao.id}`,
    data: { requisicao },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined

  const handleClick = () => {
    router.push(`/comercial/requisicoes-amostra-comercial/${requisicao.id}`)
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
      } ${requisicao.id ? "cursor-pointer" : "cursor-grab"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          #{requisicao.id}
        </span>
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1 line-clamp-2">
        {requisicao.titulo || "Sem título"}
      </p>
      {requisicao.produtoCodigo && (
        <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-0.5">
          {requisicao.produtoCodigo}
        </p>
      )}
      {requisicao.produtoDescricao && (
        <p className="text-[10px] text-slate-500 line-clamp-1">{requisicao.produtoDescricao}</p>
      )}
      {requisicao.cliente && (
        <p className="text-[10px] text-slate-400 mt-1">{requisicao.cliente}</p>
      )}
    </div>
  )
}

export function KanbanAmostraComercial() {
  const { data: session } = useSession()
  const role = session?.user?.role as string | undefined
  const podeArrastar = role ? ROLES_PERMITIDOS.includes(role) : false

  const [statusList, setStatusList] = useState<StatusCol[]>([])
  const [requisicoes, setRequisicoes] = useState<RequisicaoCard[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState<RequisicaoCard | null>(null)
  const [motivoModal, setMotivoModal] = useState<{ requisicao: RequisicaoCard; novoStatus: string } | null>(null)
  const [motivoText, setMotivoText] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [statusRes, reqRes] = await Promise.all([
        fetch("/api/admin/status?tipo=AMOSTRA_COMERCIAL").then(r => r.json()),
        fetch("/api/requisicoes-amostra-comercial").then(r => r.json()),
      ])
      if (Array.isArray(statusRes)) setStatusList(statusRes)
      if (Array.isArray(reqRes)) {
        setRequisicoes(reqRes.map((r: any) => ({
          id: r.id,
          titulo: r.titulo,
          cliente: r.cliente,
          produtoCodigo: r.produtoCodigo,
          produtoDescricao: r.produtoDescricao,
          status: r.status,
          quantidade: r.quantidade,
        })))
      }
    } catch {
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const colunas = statusList
    .map(col => ({
      ...col,
      cards: requisicoes.filter(r => r.status === col.nome),
    }))

  const handleDragStart = (event: any) => {
    const card = event.active.data.current?.requisicao
    if (card) setActiveCard(card)
  }

  const handleDragEnd = async (event: any) => {
    setActiveCard(null)
    if (!podeArrastar) return

    const { active, over } = event
    if (!over || active.id === over.id) return

    const requisicao = active.data.current?.requisicao as RequisicaoCard | undefined
    if (!requisicao) return

    const novoStatus = over.id as string
    if (requisicao.status === novoStatus) return

    const precisaMotivo = novoStatus.startsWith("APROVADO") || novoStatus === "REPROVADO"

    if (precisaMotivo) {
      setMotivoModal({ requisicao, novoStatus })
      setMotivoText("")
      return
    }

    await executarMudancaStatus(requisicao, novoStatus)
  }

  const executarMudancaStatus = async (requisicao: RequisicaoCard, novoStatus: string, motivo?: string) => {
    const statusAntigo = requisicao.status

    setRequisicoes(prev =>
      prev.map(r => r.id === requisicao.id ? { ...r, status: novoStatus } : r)
    )

    try {
      const res = await fetch("/api/requisicoes-amostra-comercial/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requisicao.id,
          status: novoStatus,
          motivo: motivo || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao alterar status")
      }
      toast.success(`Requisição #${requisicao.id} movida para ${statusList.find(s => s.nome === novoStatus)?.rotulo || novoStatus}`)
    } catch (err: any) {
      setRequisicoes(prev =>
        prev.map(r => r.id === requisicao.id ? { ...r, status: statusAntigo } : r)
      )
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
    <>
      {!podeArrastar && (
        <div className="shrink-0">
          <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-3 py-2 rounded-lg">
            Seu perfil não tem permissão para mover requisições entre colunas.
          </p>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto">
          {colunas.map(col => (
            <DroppableColumn key={col.nome} id={col.nome} rotulo={col.rotulo} cor={col.cor} count={col.cards.length}>
              {col.cards.map(card => (
                <DraggableCard key={`req-${card.id}`} requisicao={card} />
              ))}
            </DroppableColumn>
          ))}
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-400 shadow-xl p-3 w-72 opacity-90">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                  #{activeCard.id}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-900 mt-1">{activeCard.titulo || "Sem título"}</p>
              {activeCard.produtoCodigo && (
                <p className="text-xs font-mono text-blue-600 mt-0.5">{activeCard.produtoCodigo}</p>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {motivoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              <h3 className="text-lg font-semibold">
                {motivoModal.novoStatus.startsWith("APROVADO") ? "Aprovar" : "Reprovar"} Requisição
              </h3>
            </div>
            <p className="text-sm text-slate-500">
              {motivoModal.novoStatus.startsWith("APROVADO")
                ? "Informe o motivo da aprovação"
                : "Informe o motivo da reprovação"}
            </p>
            <textarea
              value={motivoText}
              onChange={e => setMotivoText(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Motivo / Observação *"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMotivoModal(null)}>
                Cancelar
              </Button>
              <Button
                disabled={!motivoText.trim()}
                onClick={async () => {
                  const { requisicao, novoStatus } = motivoModal
                  setMotivoModal(null)
                  await executarMudancaStatus(requisicao, novoStatus, motivoText.trim())
                }}
              >
                {motivoModal.novoStatus.startsWith("APROVADO") ? "Aprovar" : "Reprovar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
