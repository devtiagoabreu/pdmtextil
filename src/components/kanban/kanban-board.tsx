"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Loader2 } from "lucide-react"
import { ROLES_PERMITIDOS } from "./types"
import type { StatusCol, Solicitacao, ChatMensagem, AmostraItem, PilotagemAmostra } from "./types"
import { DroppableColumn } from "./column"
import { DraggableCard } from "./card"
import { DragOverlayCard } from "./drag-overlay-card"
import { ChatDialog } from "./chat-dialog"
import { AmostrasDialog } from "./amostras-dialog"
import { PilotagemDialog } from "./pilotagem-dialog"

export function KanbanBoard() {
  const { data: session } = useSession()
  const role = session?.user?.role as string | undefined
  const podeArrastar = role ? ROLES_PERMITIDOS.includes(role) : false

  const [statusList, setStatusList] = useState<StatusCol[]>([])
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [activeCard, setActiveCard] = useState<Solicitacao | null>(null)

  const [chatTarget, setChatTarget] = useState<Solicitacao | null>(null)
  const [chatMensagens, setChatMensagens] = useState<ChatMensagem[]>([])
  const [chatLoading, setChatLoading] = useState(false)

  const [amostrasTarget, setAmostrasTarget] = useState<Solicitacao | null>(null)
  const [amostrasData, setAmostrasData] = useState<AmostraItem[]>([])
  const [amostrasLoading, setAmostrasLoading] = useState(false)

  const [pilotagemTarget, setPilotagemTarget] = useState<Solicitacao | null>(null)
  const [pilotagemAmostras, setPilotagemAmostras] = useState<PilotagemAmostra[]>([])
  const [pilotagemSelecionadas, setPilotagemSelecionadas] = useState<Set<string>>(new Set())
  const [pilotagemLoading, setPilotagemLoading] = useState(false)
  const [pilotagemSubmitting, setPilotagemSubmitting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const { data, isLoading, error } = useQuery<{ statusList: StatusCol[]; solicitacoes: Solicitacao[] }>({
    queryKey: ["kanban-board"],
    queryFn: async () => {
      const [statusRes, solRes] = await Promise.all([
        fetch("/api/admin/status?tipo=SOLICITACAO_DESENVOLVIMENTO").then((r: any) => r.json()),
        fetch("/api/solicitacoes").then((r: any) => r.json()),
      ])
      return {
        statusList: Array.isArray(statusRes) ? statusRes : [],
        solicitacoes: Array.isArray(solRes) ? solRes : [],
      }
    },
  })

  useEffect(() => {
    if (error) toast.error("Erro ao carregar dados")
  }, [error])

  useEffect(() => {
    if (data) {
      setStatusList(data.statusList)
      setSolicitacoes(data.solicitacoes)
    }
  }, [data])

  const loading = isLoading && !data

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
      const lista: AmostraItem[] = []
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
    .filter((s: any) => s.nome !== "REPROVADO" || true)
    .map((col: any) => ({
      ...col,
      cards: solicitacoes.filter((s: any) => s.status === col.nome),
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

    if (novoStatus === "PILOTAGEM") {
      setPilotagemTarget(solicitacao)
      setPilotagemAmostras([])
      setPilotagemSelecionadas(new Set())
      if (!solicitacao.produtoId) {
        toast.error("Solicitação não possui produto vinculado")
        return
      }
      setPilotagemLoading(true)
      try {
        const res = await fetch(`/api/cadastros/produto-cru/${solicitacao.produtoId}`)
        const data = await res.json()
        const lista: PilotagemAmostra[] = []
        if (Array.isArray(data.amostras)) {
          for (const a of data.amostras) {
            if (a.status !== "EM_PRODUCAO_TEC" && a.status !== "EM_PRODUCAO_BEN") {
              lista.push({ id: a.id, tipo: "tecido_cru", descricao: a.descricao, status: a.status, produtoCruId: data.id, rotulo: "Tecido Cru" })
            }
          }
        }
        if (Array.isArray(data.acabamentos)) {
          for (const ac of data.acabamentos) {
            if (Array.isArray(ac.amostras)) {
              for (const a of ac.amostras) {
                if (a.status !== "EM_PRODUCAO_TEC" && a.status !== "EM_PRODUCAO_BEN") {
                  lista.push({ id: a.id, tipo: "acabamento", descricao: a.descricao, status: a.status, produtoCruId: data.id, acabamentoId: ac.id, rotulo: `Acabamento (${ac.tipoAcabamento || ""})` })
                }
              }
            }
          }
        }
        setPilotagemAmostras(lista)
      } catch {
        toast.error("Erro ao carregar amostras")
      }
      setPilotagemLoading(false)
      return
    }

    const statusAntigo = solicitacao.status

    setSolicitacoes(prev =>
      prev.map((s: any) => s.id === solicitacao.id ? { ...s, status: novoStatus } : s)
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
      toast.success(`Solicitação #${solicitacao.id} movida para ${statusList.find((s: any) => s.nome === novoStatus)?.rotulo || novoStatus}`)
    } catch (err: any) {
      setSolicitacoes(prev =>
        prev.map((s: any) => s.id === solicitacao.id ? { ...s, status: statusAntigo } : s)
      )
      toast.error(err.message)
    }
  }

  async function confirmarPilotagem() {
    if (!pilotagemTarget || pilotagemSelecionadas.size === 0) return
    setPilotagemSubmitting(true)
    try {
      const promises: Promise<any>[] = []
      for (const key of pilotagemSelecionadas) {
        const [tipo, amostraId] = key.split("-")
        const amostra = pilotagemAmostras.find((a: any) => a.id === parseInt(amostraId) && a.tipo === tipo)
        if (!amostra) continue
        if (tipo === "tecido_cru") {
          promises.push(
            fetch(`/api/cadastros/produto-cru/${amostra.produtoCruId}/amostras/${amostra.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "EM_PRODUCAO_TEC" }),
            })
          )
        } else if (tipo === "acabamento" && amostra.acabamentoId) {
          promises.push(
            fetch(`/api/cadastros/produto-cru/${amostra.produtoCruId}/acabamentos/${amostra.acabamentoId}/amostras/${amostra.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "EM_PRODUCAO_BEN" }),
            })
          )
        }
      }
      promises.push(
        fetch(`/api/solicitacoes/${pilotagemTarget.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PILOTAGEM" }),
        })
      )
      await Promise.all(promises)
      setSolicitacoes(prev =>
        prev.map((s: any) => s.id === pilotagemTarget.id ? { ...s, status: "PILOTAGEM" } : s)
      )
      toast.success(`Solicitação #${pilotagemTarget.id} movida para Pilotagem com ${pilotagemSelecionadas.size} amostra(s)`)
      setPilotagemTarget(null)
    } catch {
      toast.error("Erro ao iniciar pilotagem")
    }
    setPilotagemSubmitting(false)
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
          {colunas.map((col: any) => (
            <DroppableColumn key={col.nome} id={col.nome} rotulo={col.rotulo} cor={col.cor} count={col.cards.length}>
              {col.cards.map((card: any) => (
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
          {activeCard && <DragOverlayCard card={activeCard} />}
        </DragOverlay>
      </DndContext>

      <ChatDialog
        target={chatTarget}
        mensagens={chatMensagens}
        loading={chatLoading}
        onClose={() => setChatTarget(null)}
      />

      <AmostrasDialog
        target={amostrasTarget}
        data={amostrasData}
        loading={amostrasLoading}
        onClose={() => setAmostrasTarget(null)}
      />

      <PilotagemDialog
        target={pilotagemTarget}
        amostras={pilotagemAmostras}
        selecionadas={pilotagemSelecionadas}
        setSelecionadas={setPilotagemSelecionadas}
        loading={pilotagemLoading}
        submitting={pilotagemSubmitting}
        onConfirm={confirmarPilotagem}
        onClose={() => setPilotagemTarget(null)}
      />
    </>
  )
}
