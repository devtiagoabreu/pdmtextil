"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Loader2, Calendar, MessageSquare, FileText, ExternalLink } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

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
  produtoId?: number | null
  produtoCodigoPdm?: string | null
  produtoIdIntegracao?: string | null
  produtoAmostrasCount?: number
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

function DraggableCard({
  solicitacao,
  onOpenChat,
  onOpenAmostras,
}: {
  solicitacao: Solicitacao
  onOpenChat: (s: Solicitacao) => void
  onOpenAmostras: (s: Solicitacao) => void
}) {
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
            <button
              onClick={(e) => { e.stopPropagation(); onOpenChat(solicitacao) }}
              title="Ver resumo do chat"
              className="text-blue-500 hover:text-blue-700 transition-colors"
            >
              <MessageSquare size={11} />
            </button>
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
            <button
              onClick={(e) => { e.stopPropagation(); onOpenAmostras(solicitacao) }}
              className="ml-auto text-blue-500 hover:text-blue-700 hover:underline transition-colors"
              title="Ver amostras do produto"
            >
              {solicitacao.produtoAmostrasCount} amostra{solicitacao.produtoAmostrasCount > 1 ? "s" : ""}
            </button>
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

export function KanbanBoard() {
  const { data: session } = useSession()
  const role = session?.user?.role as string | undefined
  const podeArrastar = role ? ROLES_PERMITIDOS.includes(role) : false

  const [statusList, setStatusList] = useState<StatusCol[]>([])
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState<Solicitacao | null>(null)

  const [chatTarget, setChatTarget] = useState<Solicitacao | null>(null)
  const [chatMensagens, setChatMensagens] = useState<{ remetenteNome: string; mensagem: string; createdAt: string }[]>([])
  const [chatLoading, setChatLoading] = useState(false)

  const [amostrasTarget, setAmostrasTarget] = useState<Solicitacao | null>(null)
  const [amostrasData, setAmostrasData] = useState<{ tipo: string; descricao: string | null; status: string; id: number; scrollId: string }[]>([])
  const [amostrasLoading, setAmostrasLoading] = useState(false)

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

  async function abrirChat(s: Solicitacao) {
    setChatTarget(s)
    setChatMensagens([])
    setChatLoading(true)
    try {
      const res = await fetch(`/api/chats/entidade?tipo=SOLICITACAO&id=${s.id}`)
      const chat = await res.json()
      if (chat && chat.id) {
        const msgsRes = await fetch(`/api/chats/${chat.id}/mensagens`)
        const msgsData = await msgsRes.json()
        if (Array.isArray(msgsData.mensagens)) {
          setChatMensagens(msgsData.mensagens.slice(-5).reverse())
        }
      }
    } catch {}
    setChatLoading(false)
  }

  async function abrirAmostras(s: Solicitacao) {
    setAmostrasTarget(s)
    setAmostrasData([])
    if (!s.produtoId) return
    setAmostrasLoading(true)
    try {
      const res = await fetch(`/api/cadastros/produto-cru/${s.produtoId}`)
      const data = await res.json()
      const lista: { tipo: string; descricao: string | null; status: string; id: number; scrollId: string }[] = []
      if (Array.isArray(data.amostras)) {
        for (const a of data.amostras) {
          lista.push({ tipo: "Tecido Cru", descricao: a.descricao, status: a.status, id: a.id, scrollId: `amostra-${a.id}` })
        }
      }
      if (Array.isArray(data.acabamentos)) {
        for (const ac of data.acabamentos) {
          if (Array.isArray(ac.amostras)) {
            for (const a of ac.amostras) {
              lista.push({ tipo: `Acabamento (${ac.tipoAcabamento || ""})`, descricao: a.descricao, status: a.status, id: a.id, scrollId: `amostra-acab-${ac.id}-${a.id}` })
            }
          }
        }
      }
      setAmostrasData(lista)
    } catch {}
    setAmostrasLoading(false)
  }

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

    const statusAntigo = solicitacao.status

    setSolicitacoes(prev =>
      prev.map(s => s.id === solicitacao.id ? { ...s, status: novoStatus } : s)
    )

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
    } catch (err: any) {
      setSolicitacoes(prev =>
        prev.map(s => s.id === solicitacao.id ? { ...s, status: statusAntigo } : s)
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
            Seu perfil não tem permissão para mover solicitações entre colunas.
          </p>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto">
          {colunas.map(col => (
            <DroppableColumn key={col.nome} id={col.nome} rotulo={col.rotulo} cor={col.cor} count={col.cards.length}>
              {col.cards.map(card => (
                <DraggableCard
                  key={card.id}
                  solicitacao={card}
                  onOpenChat={abrirChat}
                  onOpenAmostras={abrirAmostras}
                />
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
                  {activeCard.chatExists && <MessageSquare size={11} className="text-blue-500" />}
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

      <Dialog open={!!chatTarget} onOpenChange={(open: boolean) => { if (!open) setChatTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chat — #{chatTarget?.id} {chatTarget?.cliente}</DialogTitle>
            <DialogDescription>
              Últimas mensagens do chat da solicitação
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {chatLoading ? (
              <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-slate-400" /></div>
            ) : chatMensagens.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhuma mensagem encontrada</p>
            ) : (
              chatMensagens.map((msg, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{msg.remetenteNome}</span>
                    <span className="text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleString("pt-BR")}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{msg.mensagem}</p>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Link
              href={`/comercial/solicitacoes/${chatTarget?.id}`}
              onClick={() => setChatTarget(null)}
              className="inline-flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
            >
              <MessageSquare size={14} /> Ver chat completo
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!amostrasTarget} onOpenChange={(open: boolean) => { if (!open) setAmostrasTarget(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Amostras — {amostrasTarget?.produtoCodigoPdm || `#${amostrasTarget?.id}`}</DialogTitle>
            <DialogDescription>
              {amostrasData.length} amostra{amostrasData.length !== 1 ? "s" : ""} encontrada{amostrasData.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto space-y-2">
            {amostrasLoading ? (
              <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-slate-400" /></div>
            ) : amostrasData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhuma amostra encontrada</p>
            ) : (
              amostrasData.map((a, i) => (
                <Link
                  key={i}
                  href={amostrasTarget?.produtoId ? `/cadastros/produto-cru/${amostrasTarget.produtoId}?tab=amostras&amostraId=${encodeURIComponent(a.scrollId)}` : "#"}
                  onClick={() => setAmostrasTarget(null)}
                  className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors group"
                >
                  <FileText size={14} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{a.tipo}</span>
                      <span className="text-[10px] uppercase text-slate-400">{a.status}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{a.descricao || "Sem descrição"}</p>
                  </div>
                  <ExternalLink size={12} className="text-slate-300 group-hover:text-blue-500 shrink-0" />
                </Link>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
