"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import {
  CheckCircle2,
  Eye,
  ExternalLink,
  Link as LinkIcon,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
  Video,
} from "lucide-react"

import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import {
  PROJETO_VALUES,
  STATUS_ENCAMINHAMENTO_VALUES,
  STATUS_REUNIAO_VALUES,
  labelProjeto,
  labelStatusEncaminhamento,
  labelStatusReuniao,
  podeEscreverReuniao,
  podeExcluirReuniao,
} from "@/lib/reunioes"

type ReuniaoListaItem = {
  id: number
  titulo: string
  projeto: string
  data: string
  local: string | null
  status: string
  videoUrl: string | null
  createdAt: string | null
  updatedAt: string | null
  _count: { pautas: number; participantes: number; encaminhamentos: number; links: number }
}

type ReuniaoDetalhe = {
  id: number
  titulo: string
  projeto: string
  data: string
  local: string | null
  status: string
  videoUrl: string | null
  createdAt: string | null
  updatedAt: string | null
  resumoCurto: string | null
  resumoDetalhado: string | null
  resumoItensAcao: string | null
  transcricao: string | null
  ata: { conteudo: string; criadoPor: string | null } | null
  pautas: { id: number; descricao: string; ordem: number }[]
  participantes: { id: number; nome: string; empresa: string | null; papel: string | null }[]
  encaminhamentos: { id: number; descricao: string; responsavel: string | null; prazo: string | null; status: string }[]
  links: { id: number; rotulo: string; url: string; descricao: string | null; ordem: number }[]
}

type FormEncaminhamento = { descricao: string; responsavel: string; prazo: string; status: string }

type Formulario = {
  titulo: string
  projeto: string
  data: string
  local: string
  status: string
  videoUrl: string
  resumoCurto: string
  resumoDetalhado: string
  resumoItensAcao: string
  ata: string
  transcricao: string
  pautas: { descricao: string }[]
  participantes: { nome: string; empresa: string; papel: string }[]
  encaminhamentos: FormEncaminhamento[]
  links: { rotulo: string; url: string; descricao: string }[]
}

const FORMULARIO_VAZIO: Formulario = {
  titulo: "",
  projeto: PROJETO_VALUES[0],
  data: "",
  local: "",
  status: STATUS_REUNIAO_VALUES[0],
  videoUrl: "",
  resumoCurto: "",
  resumoDetalhado: "",
  resumoItensAcao: "",
  ata: "",
  transcricao: "",
  pautas: [],
  participantes: [],
  encaminhamentos: [],
  links: [],
}

const LISTAS_FORMULARIO = ["pautas", "participantes", "encaminhamentos", "links"] as const
type ListaFormulario = (typeof LISTAS_FORMULARIO)[number]

const STATUS_CORES: Record<string, string> = {
  AGENDADA: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  REALIZADA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  CANCELADA: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
}

const SELECT_CLASS =
  "rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-sm"

function paraInputDatetimeLocal(valor: string | null | undefined): string {
  if (!valor) return ""
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatarDataHora(valor: string | null | undefined): string {
  if (!valor) return "—"
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function ReunioesPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const { data: session } = useSession()
  const role = session?.user?.role ?? null
  const podeCriar = podeEscreverReuniao(role)
  const podeApagar = podeExcluirReuniao(role)
  const queryClient = useQueryClient()

  const [filtroTexto, setFiltroTexto] = useState("")
  const [filtroProjeto, setFiltroProjeto] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")

  const [formAberto, setFormAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VAZIO)

  const [detalhe, setDetalhe] = useState<ReuniaoDetalhe | null>(null)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)

  const [excluindo, setExcluindo] = useState<ReuniaoListaItem | ReuniaoDetalhe | null>(null)
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(false)

  const { data: lista, isLoading } = useQuery({
    queryKey: ["reunioes"],
    queryFn: async () => {
      const res = await fetch("/api/reunioes")
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error("Falha ao carregar as reuniões.")
      return ((json as { reunioes?: ReuniaoListaItem[] }).reunioes ?? []) as ReuniaoListaItem[]
    },
  })

  const filtradas = useMemo(() => {
    const base = lista ?? []
    const q = filtroTexto.trim().toLowerCase()
    return base.filter((r) => {
      if (filtroProjeto && r.projeto !== filtroProjeto) return false
      if (filtroStatus && r.status !== filtroStatus) return false
      if (q && !r.titulo.toLowerCase().includes(q) && !(r.local ?? "").toLowerCase().includes(q)) return false
      return true
    })
  }, [lista, filtroTexto, filtroProjeto, filtroStatus])

  const mutationSalvar = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const id = editandoId
      const url = id ? `/api/reunioes/${id}` : "/api/reunioes"
      const res = await fetch(url, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error((json as { error?: string })?.error ?? "Falha ao salvar a reunião.")
      return json
    },
    onSuccess: () => {
      toast.success(editandoId ? "Reunião atualizada com sucesso." : "Reunião criada com sucesso.")
      setFormAberto(false)
      setEditandoId(null)
      setFormulario(FORMULARIO_VAZIO)
      queryClient.invalidateQueries({ queryKey: ["reunioes"] })
    },
    onError: (erro: Error) => {
      toast.error(erro.message)
    },
  })

  const mutationExcluir = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/reunioes/${id}`, { method: "DELETE" })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error((json as { error?: string })?.error ?? "Falha ao excluir a reunião.")
      return id
    },
    onSuccess: (id) => {
      toast.success("Reunião excluída.")
      setConfirmandoExcluir(false)
      setExcluindo(null)
      if (detalhe?.id === id) setDetalhe(null)
      queryClient.invalidateQueries({ queryKey: ["reunioes"] })
    },
    onError: (erro: Error) => {
      toast.error(erro.message)
      setConfirmandoExcluir(false)
    },
  })

  async function abrirDetalhe(id: number) {
    setDetalhe(null)
    setCarregandoDetalhe(true)
    try {
      const res = await fetch(`/api/reunioes/${id}`)
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error((json as { error?: string })?.error ?? "Falha ao carregar a reunião.")
      setDetalhe((json as { reuniao: ReuniaoDetalhe }).reuniao)
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao carregar a reunião.")
    } finally {
      setCarregandoDetalhe(false)
    }
  }

  async function abrirEdicao(id: number) {
    setDetalhe(null)
    try {
      const res = await fetch(`/api/reunioes/${id}`)
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error((json as { error?: string })?.error ?? "Falha ao carregar a reunião.")
      const r = (json as { reuniao: ReuniaoDetalhe }).reuniao
      setFormulario({
        titulo: r.titulo,
        projeto: r.projeto,
        data: paraInputDatetimeLocal(r.data),
        local: r.local ?? "",
        status: r.status,
        videoUrl: r.videoUrl ?? "",
        resumoCurto: r.resumoCurto ?? "",
        resumoDetalhado: r.resumoDetalhado ?? "",
        resumoItensAcao: r.resumoItensAcao ?? "",
        ata: r.ata?.conteudo ?? "",
        transcricao: r.transcricao ?? "",
        pautas: r.pautas.map((p) => ({ descricao: p.descricao })),
        participantes: r.participantes.map((p) => ({ nome: p.nome, empresa: p.empresa ?? "", papel: p.papel ?? "" })),
        encaminhamentos: r.encaminhamentos.map((e) => ({
          descricao: e.descricao,
          responsavel: e.responsavel ?? "",
          prazo: paraInputDatetimeLocal(e.prazo),
          status: e.status,
        })),
        links: r.links.map((l) => ({ rotulo: l.rotulo, url: l.url, descricao: l.descricao ?? "" })),
      })
      setEditandoId(id)
      setFormAberto(true)
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao carregar a reunião.")
    }
  }

  function abrirNovo() {
    setEditandoId(null)
    setFormulario(FORMULARIO_VAZIO)
    setFormAberto(true)
  }

  function fecharFormulario() {
    setFormAberto(false)
    setEditandoId(null)
  }

  function setFilho(campo: ListaFormulario, indice: number, patch: Record<string, unknown>) {
    setFormulario((f) => ({
      ...f,
      [campo]: (f[campo] as Record<string, unknown>[]).map((linha, i) =>
        i === indice ? { ...linha, ...patch } : linha
      ),
    }))
  }

  function removerFilho(campo: ListaFormulario, indice: number) {
    setFormulario((f) => ({
      ...f,
      [campo]: (f[campo] as Record<string, unknown>[]).filter((_, i) => i !== indice),
    }))
  }

  function adicionarFilho(campo: ListaFormulario, vazio: Record<string, unknown>) {
    setFormulario((f) => ({ ...f, [campo]: [...(f[campo] as Record<string, unknown>[]), vazio] }))
  }

  function aoSubmeter(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const payload = {
      titulo: formulario.titulo,
      projeto: formulario.projeto,
      data: formulario.data,
      local: formulario.local || null,
      status: formulario.status,
      resumoCurto: formulario.resumoCurto || null,
      resumoDetalhado: formulario.resumoDetalhado || null,
      resumoItensAcao: formulario.resumoItensAcao || null,
      ata: formulario.ata || null,
      transcricao: formulario.transcricao || null,
      videoUrl: formulario.videoUrl || null,
      pautas: formulario.pautas.filter((p) => p.descricao.trim()).map((p) => ({ descricao: p.descricao })),
      participantes: formulario.participantes
        .filter((p) => p.nome.trim())
        .map((p) => ({ nome: p.nome, empresa: p.empresa || null, papel: p.papel || null })),
      encaminhamentos: formulario.encaminhamentos
        .filter((e) => e.descricao.trim())
        .map((e) => ({ descricao: e.descricao, responsavel: e.responsavel || null, prazo: e.prazo || null, status: e.status })),
      links: formulario.links
        .filter((l) => l.url.trim())
        .map((l) => ({ rotulo: l.rotulo || null, url: l.url, descricao: l.descricao || null })),
    }
    mutationSalvar.mutate(payload)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          Reuniões
          {info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Registre e acompanhe reuniões internas e de projetos, com pauta, participantes, encaminhamentos, links e ata.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            aria-label="Buscar reunião"
            placeholder="Buscar reunião..."
            className="w-56"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
          <select
            aria-label="Filtrar por projeto"
            className={SELECT_CLASS}
            value={filtroProjeto}
            onChange={(e) => setFiltroProjeto(e.target.value)}
          >
            <option value="">Todos os projetos</option>
            {PROJETO_VALUES.map((p) => (
              <option key={p} value={p}>
                {labelProjeto(p)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por status"
            className={SELECT_CLASS}
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            {STATUS_REUNIAO_VALUES.map((s) => (
              <option key={s} value={s}>
                {labelStatusReuniao(s)}
              </option>
            ))}
          </select>
        </div>
        {podeCriar && (
          <Button onClick={abrirNovo}>
            <Plus />
            Nova reunião
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-10">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhuma reunião encontrada.
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-50">{r.titulo}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {labelProjeto(r.projeto)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_CORES[r.status] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {labelStatusReuniao(r.status)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatarDataHora(r.data)}
                    {r.local ? ` • ${r.local}` : ""}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => abrirDetalhe(r.id)}>
                    <Eye />
                    Ver
                  </Button>
                  {podeCriar && (
                    <Button variant="outline" size="sm" onClick={() => abrirEdicao(r.id)}>
                      <Pencil />
                      Editar
                    </Button>
                  )}
                  {podeApagar && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setExcluindo(r)
                        setConfirmandoExcluir(true)
                      }}
                    >
                      <Trash2 />
                      Excluir
                    </Button>
                  )}
                </div>
              </div>
              {(r._count.pautas > 0 || r._count.participantes > 0 || r._count.encaminhamentos > 0 || r._count.links > 0) && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {r._count.pautas > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <ListChecks size={14} />
                      {r._count.pautas} pauta{r._count.pautas > 1 ? "s" : ""}
                    </span>
                  )}
                  {r._count.participantes > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Users size={14} />
                      {r._count.participantes} participante{r._count.participantes > 1 ? "s" : ""}
                    </span>
                  )}
                  {r._count.encaminhamentos > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      {r._count.encaminhamentos} encaminhamento{r._count.encaminhamentos > 1 ? "s" : ""}
                    </span>
                  )}
                  {r._count.links > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <LinkIcon size={14} />
                      {r._count.links} link{r._count.links > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={formAberto} onOpenChange={(next) => { if (!next) fecharFormulario() }}>
        <DialogContent className="max-w-3xl">
          <form onSubmit={aoSubmeter} className="max-h-[75vh] overflow-y-auto pr-1">
            <DialogHeader>
              <DialogTitle>{editandoId ? "Editar reunião" : "Nova reunião"}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="reu-titulo">Título *</Label>
                <Input
                  id="reu-titulo"
                  value={formulario.titulo}
                  onChange={(e) => setFormulario((f) => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ex: Rodada de release de setembro"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reu-projeto">Projeto</Label>
                <select
                  id="reu-projeto"
                  className={SELECT_CLASS}
                  value={formulario.projeto}
                  onChange={(e) => setFormulario((f) => ({ ...f, projeto: e.target.value }))}
                >
                  {PROJETO_VALUES.map((p) => (
                    <option key={p} value={p}>
                      {labelProjeto(p)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reu-data">Data/hora *</Label>
                <Input
                  id="reu-data"
                  type="datetime-local"
                  value={formulario.data}
                  onChange={(e) => setFormulario((f) => ({ ...f, data: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reu-local">Local</Label>
                <Input
                  id="reu-local"
                  value={formulario.local}
                  onChange={(e) => setFormulario((f) => ({ ...f, local: e.target.value }))}
                  placeholder="Ex: Sala de reuniões / Google Meet"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reu-status">Status</Label>
                <select
                  id="reu-status"
                  className={SELECT_CLASS}
                  value={formulario.status}
                  onChange={(e) => setFormulario((f) => ({ ...f, status: e.target.value }))}
                >
                  {STATUS_REUNIAO_VALUES.map((s) => (
                    <option key={s} value={s}>
                      {labelStatusReuniao(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="reu-video">Link do vídeo (gravação)</Label>
                <Input
                  id="reu-video"
                  value={formulario.videoUrl}
                  onChange={(e) => setFormulario((f) => ({ ...f, videoUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Pauta</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adicionarFilho("pautas", { descricao: "" })}
                >
                  <Plus />
                  Adicionar item
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {formulario.pautas.length === 0 && (
                  <p className="text-xs text-slate-400">Nenhum item de pauta adicionado.</p>
                )}
                {formulario.pautas.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      aria-label={`Item de pauta ${i + 1}`}
                      value={p.descricao}
                      onChange={(e) => setFilho("pautas", i, { descricao: e.target.value })}
                      placeholder="Descrição do item"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removerFilho("pautas", i)}
                      aria-label={`Remover item de pauta ${i + 1}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Participantes</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adicionarFilho("participantes", { nome: "", empresa: "", papel: "" })}
                >
                  <Plus />
                  Adicionar participante
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {formulario.participantes.length === 0 && (
                  <p className="text-xs text-slate-400">Nenhum participante adicionado.</p>
                )}
                {formulario.participantes.map((p, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <Input
                      aria-label={`Nome do participante ${i + 1}`}
                      className="w-48"
                      value={p.nome}
                      onChange={(e) => setFilho("participantes", i, { nome: e.target.value })}
                      placeholder="Nome"
                    />
                    <Input
                      aria-label={`Empresa do participante ${i + 1}`}
                      className="w-40"
                      value={p.empresa}
                      onChange={(e) => setFilho("participantes", i, { empresa: e.target.value })}
                      placeholder="Empresa"
                    />
                    <Input
                      aria-label={`Papel do participante ${i + 1}`}
                      className="w-40"
                      value={p.papel}
                      onChange={(e) => setFilho("participantes", i, { papel: e.target.value })}
                      placeholder="Papel"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removerFilho("participantes", i)}
                      aria-label={`Remover participante ${i + 1}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Encaminhamentos</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    adicionarFilho("encaminhamentos", { descricao: "", responsavel: "", prazo: "", status: "PENDENTE" })
                  }
                >
                  <Plus />
                  Adicionar encaminhamento
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {formulario.encaminhamentos.length === 0 && (
                  <p className="text-xs text-slate-400">Nenhum encaminhamento adicionado.</p>
                )}
                {formulario.encaminhamentos.map((e, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <Input
                      aria-label={`Descrição do encaminhamento ${i + 1}`}
                      className="w-56"
                      value={e.descricao}
                      onChange={(ev) => setFilho("encaminhamentos", i, { descricao: ev.target.value })}
                      placeholder="Ação / tarefa"
                    />
                    <Input
                      aria-label={`Responsável do encaminhamento ${i + 1}`}
                      className="w-36"
                      value={e.responsavel}
                      onChange={(ev) => setFilho("encaminhamentos", i, { responsavel: ev.target.value })}
                      placeholder="Responsável"
                    />
                    <Input
                      aria-label={`Prazo do encaminhamento ${i + 1}`}
                      type="datetime-local"
                      className="w-44"
                      value={e.prazo}
                      onChange={(ev) => setFilho("encaminhamentos", i, { prazo: ev.target.value })}
                    />
                    <select
                      aria-label={`Status do encaminhamento ${i + 1}`}
                      className={SELECT_CLASS}
                      value={e.status}
                      onChange={(ev) => setFilho("encaminhamentos", i, { status: ev.target.value })}
                    >
                      {STATUS_ENCAMINHAMENTO_VALUES.map((s) => (
                        <option key={s} value={s}>
                          {labelStatusEncaminhamento(s)}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removerFilho("encaminhamentos", i)}
                      aria-label={`Remover encaminhamento ${i + 1}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Links</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adicionarFilho("links", { rotulo: "", url: "", descricao: "" })}
                >
                  <Plus />
                  Adicionar link
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {formulario.links.length === 0 && (
                  <p className="text-xs text-slate-400">Nenhum link adicionado.</p>
                )}
                {formulario.links.map((l, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <Input
                      aria-label={`Rótulo do link ${i + 1}`}
                      className="w-32"
                      value={l.rotulo}
                      onChange={(ev) => setFilho("links", i, { rotulo: ev.target.value })}
                      placeholder="Rótulo"
                    />
                    <Input
                      aria-label={`URL do link ${i + 1}`}
                      className="w-56"
                      value={l.url}
                      onChange={(ev) => setFilho("links", i, { url: ev.target.value })}
                      placeholder="https://..."
                    />
                    <Input
                      aria-label={`Descrição do link ${i + 1}`}
                      className="w-40"
                      value={l.descricao}
                      onChange={(ev) => setFilho("links", i, { descricao: ev.target.value })}
                      placeholder="Descrição"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removerFilho("links", i)}
                      aria-label={`Remover link ${i + 1}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reu-resumo-curto">Resumo curto</Label>
                <Textarea
                  id="reu-resumo-curto"
                  rows={2}
                  value={formulario.resumoCurto}
                  onChange={(e) => setFormulario((f) => ({ ...f, resumoCurto: e.target.value }))}
                  placeholder="Uma frase sobre o resultado da reunião"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reu-resumo-detalhado">Resumo detalhado</Label>
                <Textarea
                  id="reu-resumo-detalhado"
                  rows={3}
                  value={formulario.resumoDetalhado}
                  onChange={(e) => setFormulario((f) => ({ ...f, resumoDetalhado: e.target.value }))}
                  placeholder="Descreva o que foi discutido"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reu-itens-acao">Itens de ação</Label>
                <Textarea
                  id="reu-itens-acao"
                  rows={2}
                  value={formulario.resumoItensAcao}
                  onChange={(e) => setFormulario((f) => ({ ...f, resumoItensAcao: e.target.value }))}
                  placeholder="Tarefas e responsáveis definidos"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reu-ata">Ata</Label>
                <Textarea
                  id="reu-ata"
                  rows={5}
                  value={formulario.ata}
                  onChange={(e) => setFormulario((f) => ({ ...f, ata: e.target.value }))}
                  placeholder="Texto completo da ata"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reu-transcricao">Transcrição</Label>
                <Textarea
                  id="reu-transcricao"
                  rows={3}
                  value={formulario.transcricao}
                  onChange={(e) => setFormulario((f) => ({ ...f, transcricao: e.target.value }))}
                  placeholder="Transcrição da gravação (opcional)"
                />
              </div>
            </div>

            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" onClick={fecharFormulario} disabled={mutationSalvar.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutationSalvar.isPending}>
                {mutationSalvar.isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Aguarde...
                  </>
                ) : editandoId ? (
                  "Atualizar"
                ) : (
                  "Criar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detalhe} onOpenChange={(next) => { if (!next) setDetalhe(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detalhe?.titulo ?? "Reunião"}</DialogTitle>
          </DialogHeader>
          {carregandoDetalhe ? (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : detalhe ? (
            <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {labelProjeto(detalhe.projeto)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_CORES[detalhe.status] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {labelStatusReuniao(detalhe.status)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatarDataHora(detalhe.data)}
                  {detalhe.local ? ` • ${detalhe.local}` : ""}
                </span>
              </div>

              {detalhe.resumoCurto && <p className="text-slate-700 dark:text-slate-300">{detalhe.resumoCurto}</p>}

              {detalhe.pautas.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Pauta
                  </h3>
                  <ol className="mt-2 list-inside list-decimal space-y-1 text-slate-700 dark:text-slate-300">
                    {detalhe.pautas.map((p) => (
                      <li key={p.id}>{p.descricao}</li>
                    ))}
                  </ol>
                </section>
              )}

              {detalhe.participantes.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Participantes
                  </h3>
                  <ul className="mt-2 space-y-1 text-slate-700 dark:text-slate-300">
                    {detalhe.participantes.map((p) => (
                      <li key={p.id}>
                        <span className="font-medium">{p.nome}</span>
                        {p.empresa ? ` — ${p.empresa}` : ""}
                        {p.papel ? ` (${p.papel})` : ""}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {detalhe.encaminhamentos.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Encaminhamentos
                  </h3>
                  <ul className="mt-2 space-y-2 text-slate-700 dark:text-slate-300">
                    {detalhe.encaminhamentos.map((e) => (
                      <li key={e.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{e.descricao}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800 dark:text-slate-300">
                            {labelStatusEncaminhamento(e.status)}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {e.responsavel ? `Responsável: ${e.responsavel}` : "Sem responsável"}
                          {e.prazo ? ` • Prazo: ${formatarDataHora(e.prazo)}` : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {detalhe.links.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Links
                  </h3>
                  <ul className="mt-2 space-y-1">
                    {detalhe.links.map((l) => (
                      <li key={l.id}>
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 underline underline-offset-3 hover:text-blue-700 dark:text-blue-400"
                        >
                          <ExternalLink size={14} />
                          {l.rotulo} — {l.url}
                        </a>
                        {l.descricao && <span className="text-slate-500 dark:text-slate-400"> ({l.descricao})</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {detalhe.resumoDetalhado && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Resumo detalhado
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{detalhe.resumoDetalhado}</p>
                </section>
              )}

              {detalhe.resumoItensAcao && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Itens de ação
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{detalhe.resumoItensAcao}</p>
                </section>
              )}

              {detalhe.ata && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ata</h3>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{detalhe.ata.conteudo}</p>
                </section>
              )}

              {detalhe.transcricao && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Transcrição
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{detalhe.transcricao}</p>
                </section>
              )}

              {detalhe.videoUrl && (
                <a
                  href={detalhe.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 underline underline-offset-3 hover:text-blue-700 dark:text-blue-400"
                >
                  <Video size={14} />
                  Assistir gravação
                </a>
              )}
            </div>
          ) : null}

          {detalhe && (
            <DialogFooter className="mt-5">
              {podeCriar && <Button variant="outline" onClick={() => abrirEdicao(detalhe.id)}><Pencil /> Editar</Button>}
              {podeApagar && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setExcluindo(detalhe)
                    setConfirmandoExcluir(true)
                  }}
                >
                  <Trash2 />
                  Excluir
                </Button>
              )}
              <Button variant="outline" onClick={() => setDetalhe(null)}>Fechar</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={confirmandoExcluir}
        title="Excluir reunião"
        message={excluindo ? `Deseja excluir a reunião "${excluindo.titulo}"?` : "Deseja excluir esta reunião?"}
        subMessage="Pauta, participantes, encaminhamentos e links vinculados também serão excluídos."
        confirmLabel="Excluir"
        loading={mutationExcluir.isPending}
        onConfirm={() => {
          if (excluindo) mutationExcluir.mutate(excluindo.id)
        }}
        onCancel={() => {
          if (!mutationExcluir.isPending) {
            setConfirmandoExcluir(false)
            setExcluindo(null)
          }
        }}
      />
    </div>
  )
}