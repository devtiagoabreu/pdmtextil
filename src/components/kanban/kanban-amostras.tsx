"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Loader2, Calendar, ExternalLink, Package, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

const ROLES_PERMITIDOS = ["COMERCIAL", "DESENVOLVIMENTO", "QUALIDADE", "PCP", "ADMIN", "SUDO"]

interface StatusCol {
  nome: string
  rotulo: string
  cor: string | null
}

interface AmostraLink {
  url: string
  descricao: string
}

interface AmostraCard {
  id: number
  tipo: "tecido_cru" | "acabamento"
  descricao: string | null
  status: string
  data: string | null
  produtoCodigo: string
  produtoDescricao: string
  produtoCruId: number | null
  acabamentoId?: number | null
  acabamentoDescricao?: string | null
  solicitacaoDesenvolvimentoId?: number | null
  tipoAmostra: string
  links?: AmostraLink[] | null
  quantidadeProduzida?: number | null
  dados: Record<string, string> | null
}

function DroppableColumn({ id, children, rotulo, cor, count }: { id: string; children: React.ReactNode; rotulo: string; cor: string | null; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full flex-1 min-w-[280px] max-w-[500px] bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors shrink-0 ${
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

function DraggableAmostraCard({ amostra }: { amostra: AmostraCard }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `amostra-${amostra.tipo}-${amostra.id}`,
    data: { amostra },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined

  const dataDate = amostra.data ? new Date(amostra.data) : null

  const scrollId = amostra.tipo === "tecido_cru"
    ? `amostra-${amostra.id}`
    : `amostra-acab-${amostra.acabamentoId}-${amostra.id}`

  const handleClick = () => {
    if (amostra.produtoCruId) {
      router.push(`/cadastros/produto-cru/${amostra.produtoCruId}?tab=amostras&amostraId=${scrollId}`)
    }
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
      } ${amostra.produtoCruId ? "cursor-pointer" : "cursor-grab"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
          amostra.tipo === "tecido_cru"
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
        }`}>
          {amostra.tipo === "tecido_cru" ? "Cru" : "Acab."}
        </span>
        <span className="text-[10px] text-slate-400">#{amostra.id}</span>
      </div>
      <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-1">
        {amostra.produtoCodigo}
      </p>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5 leading-snug line-clamp-2">
        {amostra.descricao || "Sem descrição"}
      </p>
      {amostra.tipo === "acabamento" && amostra.acabamentoDescricao && (
        <p className="text-[10px] text-slate-500 mt-0.5 italic">{amostra.acabamentoDescricao}</p>
      )}

      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        {amostra.dados?.tear && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 px-1.5 py-0.5 rounded">
            Tear: {amostra.dados.tear}
          </span>
        )}
        {amostra.quantidadeProduzida != null && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 px-1.5 py-0.5 rounded">
            <Package size={10} />
            {amostra.quantidadeProduzida}
          </span>
        )}
        {dataDate && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
            <Calendar size={10} />
            {dataDate.toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>

      {amostra.links && amostra.links.length > 0 && (
        <div className="flex flex-col gap-0.5 mt-1.5 border-t border-slate-100 dark:border-slate-700 pt-1.5">
          {amostra.links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline truncate"
            >
              <ExternalLink size={10} className="shrink-0" />
              <span className="truncate">{link.descricao || link.url}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export function KanbanAmostras() {
  const { data: session } = useSession()
  const role = session?.user?.role as string | undefined
  const podeArrastar = role ? ROLES_PERMITIDOS.includes(role) : false

  const [statusList, setStatusList] = useState<StatusCol[]>([])
  const [amostras, setAmostras] = useState<AmostraCard[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState<AmostraCard | null>(null)
  const [motivoModal, setMotivoModal] = useState<{ amostra: AmostraCard; novoStatus: string } | null>(null)
  const [motivoText, setMotivoText] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [statusRes, amostrasRes] = await Promise.all([
        fetch("/api/admin/status?tipo=AMOSTRA").then(r => r.json()),
        fetch("/api/amostras").then(r => r.json()),
      ])
      if (Array.isArray(statusRes)) setStatusList(statusRes)
      if (amostrasRes && Array.isArray(amostrasRes.tecidoCru)) {
        const flat: AmostraCard[] = [
          ...amostrasRes.tecidoCru.map((a: any) => ({
            ...a,
            tipo: "tecido_cru" as const,
            data: a.data || a.createdAt,
          })),
          ...(Array.isArray(amostrasRes.acabamento) ? amostrasRes.acabamento.map((a: any) => ({
            ...a,
            tipo: "acabamento" as const,
            data: a.data || a.createdAt,
          })) : []),
        ]
        setAmostras(flat)
      } else if (Array.isArray(amostrasRes)) {
        setAmostras(amostrasRes)
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
      cards: amostras.filter(a => a.status === col.nome),
    }))

  const handleDragStart = (event: any) => {
    const card = event.active.data.current?.amostra
    if (card) setActiveCard(card)
  }

  const handleDragEnd = async (event: any) => {
    setActiveCard(null)
    if (!podeArrastar) return

    const { active, over } = event
    if (!over || active.id === over.id) return

    const amostra = active.data.current?.amostra as AmostraCard | undefined
    if (!amostra) return

    const novoStatus = over.id as string
    if (amostra.status === novoStatus) return

    const precisaMotivo = novoStatus.startsWith("APROVADA") || novoStatus === "REPROVADA"

    if (precisaMotivo) {
      setMotivoModal({ amostra, novoStatus })
      setMotivoText("")
      return
    }

    await executarMudancaStatus(amostra, novoStatus)
  }

  const executarMudancaStatus = async (amostra: AmostraCard, novoStatus: string, motivo?: string) => {
    const statusAntigo = amostra.status

    setAmostras(prev =>
      prev.map(a => a.id === amostra.id && a.tipo === amostra.tipo ? { ...a, status: novoStatus } : a)
    )

    try {
      const res = await fetch("/api/amostras/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: amostra.tipo,
          id: amostra.id,
          status: novoStatus,
          produtoCruId: amostra.produtoCruId,
          acabamentoId: amostra.acabamentoId,
          motivo: motivo || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao alterar status")
      }
      toast.success(`Amostra #${amostra.id} movida para ${statusList.find(s => s.nome === novoStatus)?.rotulo || novoStatus}`)
    } catch (err: any) {
      setAmostras(prev =>
        prev.map(a => a.id === amostra.id && a.tipo === amostra.tipo ? { ...a, status: statusAntigo } : a)
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
            Seu perfil não tem permissão para mover amostras entre colunas.
          </p>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto">
          {colunas.map(col => (
            <DroppableColumn key={col.nome} id={col.nome} rotulo={col.rotulo} cor={col.cor} count={col.cards.length}>
              {col.cards.map(card => (
                <DraggableAmostraCard key={`${card.tipo}-${card.id}`} amostra={card} />
              ))}
            </DroppableColumn>
          ))}
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-400 shadow-xl p-3 w-72 opacity-90">
              <div className="flex items-start justify-between gap-2">
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  activeCard.tipo === "tecido_cru"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}>
                  {activeCard.tipo === "tecido_cru" ? "Cru" : "Acab."}
                </span>
                <span className="text-[10px] text-slate-400">#{activeCard.id}</span>
              </div>
              <p className="text-xs font-mono text-blue-600 mt-1">{activeCard.produtoCodigo}</p>
              <p className="text-sm font-medium text-slate-900 mt-0.5">{activeCard.descricao || "Sem descrição"}</p>
              {activeCard.quantidadeProduzida != null && (
                <div className="flex items-center gap-1 mt-1 text-[10px] text-purple-600">
                  <Package size={10} />
                  <span>Qtd: {activeCard.quantidadeProduzida}</span>
                </div>
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
                {motivoModal.novoStatus.startsWith("APROVADA") ? "Aprovar" : "Reprovar"} Amostra
              </h3>
            </div>
            <p className="text-sm text-slate-500">
              {motivoModal.novoStatus.startsWith("APROVADA")
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
                  const { amostra, novoStatus } = motivoModal
                  setMotivoModal(null)
                  await executarMudancaStatus(amostra, novoStatus, motivoText.trim())
                }}
              >
                {motivoModal.novoStatus.startsWith("APROVADA") ? "Aprovar" : "Reprovar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
