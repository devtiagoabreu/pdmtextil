"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, FolderKanban, Loader2, Pencil, Plus, Trash2 } from "lucide-react"

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
  PROJETO_STATUS_VALUES,
  labelStatusProjeto,
  podeEscreverReuniao,
  podeExcluirReuniao,
} from "@/lib/reunioes"

type ProjetoItem = {
  id: number
  nome: string
  descricao: string | null
  dataInicio: string | null
  dataFim: string | null
  status: string
  cor: string | null
  ativo: boolean
  createdAt: string | null
  updatedAt: string | null
}

type FormProjeto = {
  nome: string
  descricao: string
  dataInicio: string
  dataFim: string
  status: string
  cor: string
  ativo: boolean
}

const FORMULARIO_VAZIO: FormProjeto = {
  nome: "",
  descricao: "",
  dataInicio: "",
  dataFim: "",
  status: PROJETO_STATUS_VALUES[0],
  cor: "",
  ativo: true,
}

const STATUS_CORES: Record<string, string> = {
  EM_ANDAMENTO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  ENCERRADO: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  PLANEJADO: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
}

const SELECT_CLASS =
  "rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-sm"

function formatarData(valor: string | null | undefined): string {
  if (!valor) return "—"
  const d = new Date(`${valor}T12:00:00`)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("pt-BR")
}

export default function ProjetosPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const { data: session } = useSession()
  const role = session?.user?.role ?? null
  const podeCriar = podeEscreverReuniao(role)
  const podeApagar = podeExcluirReuniao(role)
  const queryClient = useQueryClient()

  const [filtroTexto, setFiltroTexto] = useState("")
  const [formAberto, setFormAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [formulario, setFormulario] = useState<FormProjeto>(FORMULARIO_VAZIO)
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(false)
  const [excluindo, setExcluindo] = useState<ProjetoItem | null>(null)

  const { data: projetos, isLoading } = useQuery({
    queryKey: ["reunioes-projetos"],
    queryFn: async () => {
      const res = await fetch("/api/reunioes/projetos")
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error("Falha ao carregar os projetos.")
      return ((json as { projetos?: ProjetoItem[] }).projetos ?? []) as ProjetoItem[]
    },
  })

  const filtrados = useMemo(() => {
    const base = [...(projetos ?? [])].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    const q = filtroTexto.trim().toLowerCase()
    if (!q) return base
    return base.filter(
      (p) => p.nome.toLowerCase().includes(q) || (p.descricao ?? "").toLowerCase().includes(q)
    )
  }, [projetos, filtroTexto])

  const mutationSalvar = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const id = editandoId
      const url = id ? `/api/reunioes/projetos/${id}` : "/api/reunioes/projetos"
      const res = await fetch(url, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error((json as { error?: string })?.error ?? "Falha ao salvar o projeto.")
      return json
    },
    onSuccess: () => {
      toast.success(editandoId ? "Projeto atualizado com sucesso." : "Projeto criado com sucesso.")
      setFormAberto(false)
      setEditandoId(null)
      setFormulario(FORMULARIO_VAZIO)
      queryClient.invalidateQueries({ queryKey: ["reunioes-projetos"] })
      queryClient.invalidateQueries({ queryKey: ["reunioes"] })
    },
    onError: (erro: Error) => {
      toast.error(erro.message)
    },
  })

  const mutationExcluir = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/reunioes/projetos/${id}`, { method: "DELETE" })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error((json as { error?: string })?.error ?? "Falha ao excluir o projeto.")
      return id
    },
    onSuccess: (id) => {
      toast.success("Projeto excluído.")
      setConfirmandoExcluir(false)
      setExcluindo(null)
      queryClient.invalidateQueries({ queryKey: ["reunioes-projetos"] })
      queryClient.invalidateQueries({ queryKey: ["reunioes"] })
      if (id === 1) window.location.reload()
    },
    onError: (erro: Error) => {
      toast.error(erro.message)
      setConfirmandoExcluir(false)
    },
  })

  function abrirNovo() {
    setEditandoId(null)
    setFormulario(FORMULARIO_VAZIO)
    setFormAberto(true)
  }

  function abrirEdicao(p: ProjetoItem) {
    setEditandoId(p.id)
    setFormulario({
      nome: p.nome,
      descricao: p.descricao ?? "",
      dataInicio: p.dataInicio ?? "",
      dataFim: p.dataFim ?? "",
      status: p.status,
      cor: p.cor ?? "",
      ativo: p.ativo,
    })
    setFormAberto(true)
  }

  function fecharFormulario() {
    setFormAberto(false)
    setEditandoId(null)
  }

  function aoSubmeter(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    mutationSalvar.mutate({
      nome: formulario.nome,
      descricao: formulario.descricao || null,
      dataInicio: formulario.dataInicio || null,
      dataFim: formulario.dataFim || null,
      status: formulario.status,
      cor: formulario.cor || null,
      ativo: formulario.ativo,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link
          href="/reunioes"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          <ArrowLeft className="size-4" />
          Voltar para Reuniões
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          Projetos de Reuniões
          {info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Cada reunião pertence a um projeto. Crie e edite projetos para organizar as reuniões por iniciativa.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          aria-label="Buscar projeto"
          placeholder="Buscar projeto..."
          className="w-56"
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />
        {podeCriar && (
          <Button onClick={abrirNovo}>
            <Plus />
            Novo projeto
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-10">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum projeto encontrado.
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: p.cor ?? "#94a3b8" }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-slate-900 dark:text-slate-50 inline-flex items-center gap-1.5">
                      <FolderKanban className="size-4 text-slate-400" />
                      {p.nome}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_CORES[p.status] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {labelStatusProjeto(p.status)}
                    </span>
                    {!p.ativo && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Início: {formatarData(p.dataInicio)} • Fim: {formatarData(p.dataFim)}
                  </div>
                  {p.descricao && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{p.descricao}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {podeCriar && (
                    <Button variant="outline" size="sm" onClick={() => abrirEdicao(p)}>
                      <Pencil />
                      Editar
                    </Button>
                  )}
                  {podeApagar && p.id !== 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setExcluindo(p)
                        setConfirmandoExcluir(true)
                      }}
                    >
                      <Trash2 />
                      Excluir
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formAberto} onOpenChange={(next) => { if (!next) fecharFormulario() }}>
        <DialogContent className="max-w-xl">
          <form onSubmit={aoSubmeter} className="max-h-[75vh] overflow-y-auto pr-1">
            <DialogHeader>
              <DialogTitle>{editandoId ? "Editar projeto" : "Novo projeto"}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="prj-nome">Nome *</Label>
                <Input
                  id="prj-nome"
                  value={formulario.nome}
                  onChange={(e) => setFormulario((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Integração Systêxtil"
                  required
                />
              </div>
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="prj-descricao">Descrição</Label>
                <Textarea
                  id="prj-descricao"
                  rows={2}
                  value={formulario.descricao}
                  onChange={(e) => setFormulario((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Objetivo ou contexto do projeto"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="prj-inicio">Data de início</Label>
                <Input
                  id="prj-inicio"
                  type="date"
                  value={formulario.dataInicio}
                  onChange={(e) => setFormulario((f) => ({ ...f, dataInicio: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="prj-fim">Data de fim</Label>
                <Input
                  id="prj-fim"
                  type="date"
                  value={formulario.dataFim}
                  onChange={(e) => setFormulario((f) => ({ ...f, dataFim: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="prj-status">Status</Label>
                <select
                  id="prj-status"
                  className={SELECT_CLASS}
                  value={formulario.status}
                  onChange={(e) => setFormulario((f) => ({ ...f, status: e.target.value }))}
                >
                  {PROJETO_STATUS_VALUES.map((s) => (
                    <option key={s} value={s}>
                      {labelStatusProjeto(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="prj-cor">Cor</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="prj-cor"
                    type="color"
                    className="w-12 h-9 shrink-0 cursor-pointer"
                    value={/^#[0-9a-fA-F]{6}$/.test(formulario.cor) ? formulario.cor : "#94a3b8"}
                    onChange={(e) => setFormulario((f) => ({ ...f, cor: e.target.value }))}
                  />
                  <Input
                    aria-label="Cor em hexadecimal"
                    className="w-32"
                    value={formulario.cor}
                    onChange={(e) => setFormulario((f) => ({ ...f, cor: e.target.value }))}
                    placeholder="#RRGGBB"
                  />
                </div>
              </div>
              <div className="sm:col-span-2 mt-1 flex items-center gap-2">
                <input
                  id="prj-ativo"
                  type="checkbox"
                  checked={formulario.ativo}
                  onChange={(e) => setFormulario((f) => ({ ...f, ativo: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <Label htmlFor="prj-ativo" className="font-normal">
                  Projeto ativo (aparece no formulário de reuniões)
                </Label>
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

      <ConfirmModal
        open={confirmandoExcluir}
        title="Excluir projeto"
        message={excluindo ? `Deseja excluir o projeto "${excluindo.nome}"?` : "Deseja excluir este projeto?"}
        subMessage="As reuniões vinculadas a este projeto precisam ser movidas antes da exclusão."
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