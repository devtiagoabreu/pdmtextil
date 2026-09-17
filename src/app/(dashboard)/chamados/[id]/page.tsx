"use client"

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Pencil,
  Send,
  UserCheck,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  chamadoCategoriaLabel,
  chamadoPrioridadeLabel,
  chamadoStatusLabel,
  CHAMADO_STATUS_COLORS,
  CHAMADO_PRIORIDADE_COLORS,
  CHAMADO_CATEGORIA_COLORS,
  CHAMADO_STATUS_LABELS,
  CHAMADO_PRIORIDADE_LABELS,
  CHAMADO_CATEGORIA_LABELS,
} from "@/lib/chamados/constantes"
import type { ChamadoStatus, ChamadoPrioridade, ChamadoCategoria } from "@/lib/db/schema/chamados"

interface Mensagem {
  id: number
  autorId: number | null
  autorNome: string | null
  tipo: string
  mensagem: string
  anexos?: Array<{ nome?: string; url: string }> | null
  createdAt: string
}

interface Chamado {
  id: number
  titulo: string
  descricao: string
  categoria: ChamadoCategoria
  status: ChamadoStatus
  prioridade: ChamadoPrioridade
  areaId: number
  areaNome?: string | null
  solicitanteId: number
  solicitanteNome?: string | null
  responsavelId?: number | null
  responsavelNome?: string | null
  ativoId?: number | null
  ativoNome?: string | null
  ativoCodigo?: string | null
  processoId?: number | null
  processoNome?: string | null
  slaPrimeiraRespostaPrazo?: string | null
  slaResolucaoPrazo?: string | null
  primeiraRespostaEm?: string | null
  resolvidoEm?: string | null
  fechadoEm?: string | null
  createdAt: string
  updatedAt: string
  mensagens: Mensagem[]
}

interface Area {
  id: number
  nome: string
  siteNome?: string | null
}

interface Ativo {
  id: number
  nome: string
  codigo?: string | null
}

interface Processo {
  id: number
  nome: string
  codigo?: string | null
}

const selectClass =
  "w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"

const badgeClass = (classes: string) =>
  `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${classes}`
const fallback = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"

function formatarDataHora(data?: string | null): string {
  if (!data) return "—"
  const d = new Date(data)
  if (isNaN(d.getTime())) return "—"
  return (
    d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  )
}

function statusesDisponiveis(status: ChamadoStatus): ChamadoStatus[] {
  switch (status) {
    case "ABERTO":
    case "REABERTO":
      return ["EM_ANDAMENTO", "AGUARDANDO", "RESOLVIDO", "CANCELADO"]
    case "EM_ANDAMENTO":
      return ["AGUARDANDO", "RESOLVIDO", "CANCELADO"]
    case "AGUARDANDO":
      return ["EM_ANDAMENTO", "RESOLVIDO", "CANCELADO"]
    case "RESOLVIDO":
      return ["FECHADO"]
    case "FECHADO":
      return ["REABERTO"]
    default:
      return []
  }
}

export default function ChamadoDetalhePage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const queryClient = useQueryClient()
  const id = parseInt(params.id as string)

  const [novaMensagem, setNovaMensagem] = useState("")
  const [tipoResposta, setTipoResposta] = useState<"RESPOSTA" | "NOTA">("RESPOSTA")
  const [submitting, setSubmitting] = useState(false)

  const [editando, setEditando] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editTitulo, setEditTitulo] = useState("")
  const [editDescricao, setEditDescricao] = useState("")
  const [editCategoria, setEditCategoria] = useState<ChamadoCategoria>("SOLICITACAO")
  const [editPrioridade, setEditPrioridade] = useState<ChamadoPrioridade>("MEDIA")
  const [editAreaId, setEditAreaId] = useState("")
  const [editAtivoId, setEditAtivoId] = useState("")
  const [editProcessoId, setEditProcessoId] = useState("")

  const { data: chamado, isLoading } = useQuery<Chamado>({
    queryKey: ["chamado", id],
    queryFn: async () => {
      const res = await fetch(`/api/chamados/${id}`)
      if (!res.ok) throw new Error("Falha ao carregar chamado")
      return res.json()
    },
  })

  useEffect(() => {
    if (chamado) {
      setEditTitulo(chamado.titulo)
      setEditDescricao(chamado.descricao)
      setEditCategoria(chamado.categoria)
      setEditPrioridade(chamado.prioridade)
      setEditAreaId(String(chamado.areaId))
      setEditAtivoId(chamado.ativoId ? String(chamado.ativoId) : "")
      setEditProcessoId(chamado.processoId ? String(chamado.processoId) : "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamado?.id])

  const { data: areas = [] } = useQuery<Area[]>({
    queryKey: ["chamados-detalhe-areas"],
    queryFn: async () => {
      const res = await fetch("/api/processos/areas")
      if (!res.ok) return []
      return res.json()
    },
  })
  const { data: ativos = [] } = useQuery<Ativo[]>({
    queryKey: ["chamados-detalhe-ativos"],
    queryFn: async () => {
      const res = await fetch("/api/ativos")
      if (!res.ok) return []
      return res.json()
    },
  })
  const { data: processos = [] } = useQuery<Processo[]>({
    queryKey: ["chamados-detalhe-processos"],
    queryFn: async () => {
      const res = await fetch("/api/processos/processos")
      if (!res.ok) return []
      return res.json()
    },
  })

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["chamado", id] })
    queryClient.invalidateQueries({ queryKey: ["chamados"] })
  }

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novaMensagem.trim()) {
      toast.error("Escreva uma mensagem")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/chamados/${id}/mensagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: tipoResposta, mensagem: novaMensagem.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao enviar")
      }
      setNovaMensagem("")
      toast.success("Mensagem enviada")
      refetch()
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao enviar")
    } finally {
      setSubmitting(false)
    }
  }

  const assumir = async () => {
    try {
      const res = await fetch(`/api/chamados/${id}/assumir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao assumir")
      }
      toast.success("Chamado assumido")
      refetch()
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao assumir")
    }
  }

  const mudarStatus = async (novoStatus: ChamadoStatus) => {
    if (!chamado) return
    if (novoStatus === chamado.status) return
    try {
      const res = await fetch(`/api/chamados/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao mudar status")
      }
      toast.success(`Status atualizado para ${chamadoStatusLabel(novoStatus)}`)
      refetch()
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao mudar status")
    }
  }

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitulo.trim()) {
      toast.error("Informe o título")
      return
    }
    if (!editDescricao.trim()) {
      toast.error("Descreva o problema ou solicitação")
      return
    }
    if (!editAreaId) {
      toast.error("Selecione a fila (área responsável)")
      return
    }
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/chamados/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: editTitulo.trim(),
          descricao: editDescricao.trim(),
          categoria: editCategoria,
          prioridade: editPrioridade,
          areaId: parseInt(editAreaId),
          ativoId: editAtivoId ? parseInt(editAtivoId) : null,
          processoId: editProcessoId ? parseInt(editProcessoId) : null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
      toast.success("Chamado atualizado")
      setEditando(false)
      refetch()
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao salvar")
    } finally {
      setSavingEdit(false)
    }
  }

  if (isLoading || !chamado) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    )
  }

  const statuses = statusesDisponiveis(chamado.status)
  const podeResponder = chamado.status !== "FECHADO" && chamado.status !== "CANCELADO"
  const podeEditar = chamado.status !== "FECHADO" && chamado.status !== "CANCELADO"

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/chamados")}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            #{chamado.id} {chamado.titulo}
            {info && <InfoButton content={info} />}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={badgeClass(CHAMADO_STATUS_COLORS[chamado.status] || fallback)}>
              {chamadoStatusLabel(chamado.status)}
            </span>
            <span className={badgeClass(CHAMADO_PRIORIDADE_COLORS[chamado.prioridade] || fallback)}>
              {chamadoPrioridadeLabel(chamado.prioridade)}
            </span>
            <span className={badgeClass(CHAMADO_CATEGORIA_COLORS[chamado.categoria] || fallback)}>
              {chamadoCategoriaLabel(chamado.categoria)}
            </span>
          </div>
        </div>
        {podeEditar && (
          <Button variant="outline" size="sm" onClick={() => setEditando((v) => !v)} className="gap-2">
            <Pencil size={14} />
            Editar
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-sm space-y-2">
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <div>
            <span className="text-slate-400">Fila:</span>{" "}
            <span className="font-medium text-slate-900 dark:text-slate-50">
              {chamado.areaNome || "—"}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Solicitante:</span>{" "}
            <span className="font-medium text-slate-900 dark:text-slate-50">
              {chamado.solicitanteNome || "—"}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Responsável:</span>{" "}
            <span className="font-medium text-slate-900 dark:text-slate-50">
              {chamado.responsavelNome || "—"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-slate-500">
          <span>Criado: {formatarDataHora(chamado.createdAt)}</span>
          <span>SLA 1ª resposta: {formatarDataHora(chamado.slaPrimeiraRespostaPrazo)}</span>
          <span>SLA resolução: {formatarDataHora(chamado.slaResolucaoPrazo)}</span>
          {chamado.resolvidoEm && <span>Resolvido: {formatarDataHora(chamado.resolvidoEm)}</span>}
          {chamado.fechadoEm && <span>Fechado: {formatarDataHora(chamado.fechadoEm)}</span>}
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-slate-500">
          {chamado.ativoNome && (
            <span>
              Ativo:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {chamado.ativoCodigo ? `${chamado.ativoCodigo} — ` : ""}
                {chamado.ativoNome}
              </span>
            </span>
          )}
          {chamado.processoNome && (
            <span>
              Processo:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {chamado.processoNome}
              </span>
            </span>
          )}
        </div>
        <p className="pt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
          {chamado.descricao}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {!chamado.responsavelNome && statuses.length > 0 && (
          <Button size="sm" onClick={assumir} className="gap-2">
            <UserCheck size={16} />
            Assumir chamado
          </Button>
        )}
        {statuses.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              aria-label="Mudar status"
              className={selectClass}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) void mudarStatus(e.target.value as ChamadoStatus)
                e.target.value = ""
              }}
            >
              <option value="" disabled>
                Mudar status...
              </option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {chamadoStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
        )}
        {chamado.status === "RESOLVIDO" && (
          <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 size={16} />
            Aguardando validação do solicitante
          </span>
        )}
      </div>

      {editando && (
        <form
          onSubmit={salvarEdicao}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
        >
          <h2 className="font-semibold text-slate-900 dark:text-slate-50">Editar chamado</h2>
          <div className="space-y-2">
            <Label htmlFor="editTitulo" className="font-medium">
              Título
            </Label>
            <Input
              id="editTitulo"
              value={editTitulo}
              onChange={(e) => setEditTitulo(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editDescricao" className="font-medium">
              Descrição
            </Label>
            <textarea
              id="editDescricao"
              value={editDescricao}
              onChange={(e) => setEditDescricao(e.target.value)}
              rows={3}
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="editCategoria" className="font-medium">
                Categoria
              </Label>
              <select
                id="editCategoria"
                value={editCategoria}
                onChange={(e) => setEditCategoria(e.target.value as ChamadoCategoria)}
                className={selectClass}
              >
                {Object.entries(CHAMADO_CATEGORIA_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPrioridade" className="font-medium">
                Prioridade
              </Label>
              <select
                id="editPrioridade"
                value={editPrioridade}
                onChange={(e) => setEditPrioridade(e.target.value as ChamadoPrioridade)}
                className={selectClass}
              >
                {Object.entries(CHAMADO_PRIORIDADE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAreaId" className="font-medium">
                Fila
              </Label>
              <select
                id="editAreaId"
                value={editAreaId}
                onChange={(e) => setEditAreaId(e.target.value)}
                className={selectClass}
                required
              >
                <option value="">Selecione a fila</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.siteNome ? `${area.siteNome} — ` : ""}
                    {area.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAtivoId" className="font-medium">
                Ativo
              </Label>
              <select
                id="editAtivoId"
                value={editAtivoId}
                onChange={(e) => setEditAtivoId(e.target.value)}
                className={selectClass}
              >
                <option value="">Nenhum</option>
                {ativos.map((ativo) => (
                  <option key={ativo.id} value={ativo.id}>
                    {ativo.codigo ? `${ativo.codigo} — ` : ""}
                    {ativo.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editProcessoId" className="font-medium">
                Processo
              </Label>
              <select
                id="editProcessoId"
                value={editProcessoId}
                onChange={(e) => setEditProcessoId(e.target.value)}
                className={selectClass}
              >
                <option value="">Nenhum</option>
                {processos.map((processo) => (
                  <option key={processo.id} value={processo.id}>
                    {processo.codigo ? `${processo.codigo} — ` : ""}
                    {processo.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={savingEdit} className="gap-2">
              {savingEdit && <Loader2 size={16} className="animate-spin" />}
              Atualizar
            </Button>
            <Button variant="outline" type="button" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
        <div className="px-4 py-3">
          <h2 className="font-semibold text-slate-900 dark:text-slate-50">
            Mensagens ({chamado.mensagens.length})
          </h2>
        </div>
        {chamado.mensagens.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhuma mensagem ainda</div>
        ) : (
          chamado.mensagens.map((m) => (
            <div key={m.id} className="p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span
                  className={`text-xs font-medium ${m.tipo === "SISTEMA" ? "text-purple-600 dark:text-purple-400" : "text-slate-500 dark:text-slate-400"}`}
                >
                  {m.tipo === "SISTEMA"
                    ? "Sistema"
                    : m.tipo === "NOTA"
                      ? "Nota interna"
                      : m.autorNome || "—"}
                </span>
                <span className="text-xs text-slate-400">{formatarDataHora(m.createdAt)}</span>
              </div>
              <p
                className={`whitespace-pre-wrap text-sm ${m.tipo === "SISTEMA" ? "text-purple-700 dark:text-purple-300 italic" : m.tipo === "NOTA" ? "text-amber-700 dark:text-amber-300" : "text-slate-700 dark:text-slate-300"}`}
              >
                {m.mensagem}
              </p>
              {m.anexos && m.anexos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {m.anexos.map((anexo, i) => (
                    <a
                      key={i}
                      href={anexo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink size={12} />
                      {anexo.nome || `Anexo ${i + 1}`}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {podeResponder ? (
        <form onSubmit={enviarMensagem} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Responder como:
            </span>
            <label className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="radio"
                name="tipoResposta"
                value="RESPOSTA"
                checked={tipoResposta === "RESPOSTA"}
                onChange={() => setTipoResposta("RESPOSTA")}
              />
              Resposta
            </label>
            <label className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="radio"
                name="tipoResposta"
                value="NOTA"
                checked={tipoResposta === "NOTA"}
                onChange={() => setTipoResposta("NOTA")}
              />
              Nota interna
            </label>
          </div>
          <textarea
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            rows={3}
            placeholder="Escreva sua resposta..."
            className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Enviar
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center text-sm text-slate-500">
          Chamado {chamado.status.toLowerCase()} — nenhuma interação disponível.
          {chamado.status === "FECHADO" && (
            <span className="inline-flex items-center gap-1 ml-2">
              <ArrowUpRight size={14} />
              Use a opção de status para reabrir.
            </span>
          )}
        </div>
      )}
    </div>
  )
}