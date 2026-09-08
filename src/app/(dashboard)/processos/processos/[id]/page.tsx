"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useParams, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { ArrowLeft, Loader2, PlusCircle, ListOrdered } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { PROCESSO_STATUS_LABELS, statusLabel, STATUS_COLORS } from "@/lib/processos/constantes"

interface Area {
  id: number
  nome: string
}

interface Subprocesso {
  id: number
  nome: string
  descricao?: string | null
  ordem: number
  ativo: boolean
}

interface Atividade {
  id: number
  subprocessoId: number
  subprocessoNome?: string | null
  nome: string
  tipo: string
  responsavel?: string | null
  ordem: number
}

type ProcessoObjeto = {
  id: number | null
  areaId: string
  codigo: string
  nome: string
  objetivo: string
  responsavel: string
  status: string
  versao: string
  entradas: string
  saidas: string
  fornecedores: string
  clientes: string
  recursos: string
  sistemas: string
  equipamentos: string
  indicadores: string
  riscos: string
  controles: string
  observacoes: string
  ativo: boolean
}

const INICIAL: ProcessoObjeto = {
  id: null,
  areaId: "",
  codigo: "",
  nome: "",
  objetivo: "",
  responsavel: "",
  status: "RASCUNHO",
  versao: "0",
  entradas: "",
  saidas: "",
  fornecedores: "",
  clientes: "",
  recursos: "",
  sistemas: "",
  equipamentos: "",
  indicadores: "[]",
  riscos: "[]",
  controles: "[]",
  observacoes: "",
  ativo: true,
}

const LISTAS: { campo: keyof ProcessoObjeto; label: string }[] = [
  { campo: "entradas", label: "Entradas (uma por linha)" },
  { campo: "saidas", label: "Saídas (uma por linha)" },
  { campo: "fornecedores", label: "Fornecedores (uma por linha)" },
  { campo: "clientes", label: "Clientes (uma por linha)" },
  { campo: "recursos", label: "Recursos (uma por linha)" },
  { campo: "sistemas", label: "Sistemas (uma por linha)" },
  { campo: "equipamentos", label: "Equipamentos (uma por linha)" },
]

function paraTexto(lista?: string[] | null): string {
  return Array.isArray(lista) ? lista.filter(Boolean).join("\n") : ""
}

function parseJsonArray(texto: string, nome: string): unknown[] | null {
  if (!texto.trim()) return []
  try {
    const parsed = JSON.parse(texto)
    if (!Array.isArray(parsed)) throw new Error()
    return parsed
  } catch {
    toast.error(`O campo ${nome} não é um JSON de lista válido`)
    return null
  }
}

export default function ProcessoProcessoFormPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [processo, setProcesso] = useState<ProcessoObjeto>(INICIAL)
  const [saving, setSaving] = useState(false)

  const { data: areas = [] } = useQuery<Area[]>({
    queryKey: ["proc-areas"],
    queryFn: async () => {
      const res = await fetch("/api/processos/areas")
      if (!res.ok) throw new Error("Falha ao carregar áreas")
      return res.json()
    },
  })

  const { data: processoData, isLoading: loading } = useQuery<any>({
    queryKey: ["proc-processo", id],
    queryFn: async () => {
      const res = await fetch(`/api/processos/processos/${id}`)
      return res.json()
    },
    enabled: !!isEditing && !!id,
  })

  const { data: subprocessos = [] } = useQuery<Subprocesso[]>({
    queryKey: ["proc-subprocessos-do-processo", id],
    queryFn: async () => {
      const res = await fetch(`/api/processos/subprocessos?processoId=${id}`)
      if (!res.ok) throw new Error("Falha ao carregar subprocessos")
      return res.json()
    },
    enabled: !!isEditing && !!id,
  })

  const { data: atividades = [] } = useQuery<Atividade[]>({
    queryKey: ["proc-atividades-do-processo", id],
    queryFn: async () => {
      const res = await fetch(`/api/processos/atividades?processoId=${id}`)
      if (!res.ok) throw new Error("Falha ao carregar atividades")
      return res.json()
    },
    enabled: !!isEditing && !!id,
  })

  useEffect(() => {
    if (processoData) {
      setProcesso({
        id: processoData.id,
        areaId: processoData.areaId ? String(processoData.areaId) : "",
        codigo: processoData.codigo || "",
        nome: processoData.nome || "",
        objetivo: processoData.objetivo || "",
        responsavel: processoData.responsavel || "",
        status: processoData.status || "RASCUNHO",
        versao: String(processoData.versao ?? 0),
        entradas: paraTexto(processoData.entradas),
        saidas: paraTexto(processoData.saidas),
        fornecedores: paraTexto(processoData.fornecedores),
        clientes: paraTexto(processoData.clientes),
        recursos: paraTexto(processoData.recursos),
        sistemas: paraTexto(processoData.sistemas),
        equipamentos: paraTexto(processoData.equipamentos),
        indicadores: JSON.stringify(processoData.indicadores ?? [], null, 2),
        riscos: JSON.stringify(processoData.riscos ?? [], null, 2),
        controles: JSON.stringify(processoData.controles ?? [], null, 2),
        observacoes: processoData.observacoes || "",
        ativo: processoData.ativo ?? true,
      })
    }
  }, [processoData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!processo.nome) {
      toast.error("Nome é obrigatório")
      return
    }
    if (!processo.areaId) {
      toast.error("Selecione a área")
      return
    }
    const listaArray = (texto: string) => texto.split("\n").map((s) => s.trim()).filter(Boolean)
    const indicadores = parseJsonArray(processo.indicadores, "Indicadores")
    if (indicadores === null) return
    const riscos = parseJsonArray(processo.riscos, "Riscos")
    if (riscos === null) return
    const controles = parseJsonArray(processo.controles, "Controles")
    if (controles === null) return

    setSaving(true)
    try {
      const url = isEditing ? `/api/processos/processos/${id}` : "/api/processos/processos"
      const method = isEditing ? "PUT" : "POST"

      const body = {
        areaId: parseInt(processo.areaId),
        codigo: processo.codigo || null,
        nome: processo.nome,
        objetivo: processo.objetivo || null,
        responsavel: processo.responsavel || null,
        status: processo.status,
        versao: parseInt(processo.versao || "0") || 0,
        entradas: listaArray(processo.entradas),
        saidas: listaArray(processo.saidas),
        fornecedores: listaArray(processo.fornecedores),
        clientes: listaArray(processo.clientes),
        recursos: listaArray(processo.recursos),
        sistemas: listaArray(processo.sistemas),
        equipamentos: listaArray(processo.equipamentos),
        indicadores: indicadores as never[],
        riscos: riscos as never[],
        controles: controles as never[],
        observacoes: processo.observacoes || null,
        ativo: processo.ativo,
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(isEditing ? "Processo atualizado!" : "Processo criado!")
        router.push("/processos/processos")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao salvar processo")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof ProcessoObjeto, value: string | boolean) => {
    setProcesso(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/processos/processos">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Processo" : "Novo Processo"}
            {info && <InfoButton content={info} />}
          </h1>
        </div>
      </div>

      {isEditing && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[processo.status] || STATUS_COLORS["RASCUNHO"]}`}>
            {statusLabel(processo.status)}
          </span>
          <span>versão {processo.versao || "0"}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="areaId">Área *</Label>
          <select
            id="areaId"
            value={processo.areaId}
            onChange={e => handleChange("areaId", e.target.value)}
            className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
          >
            <option value="">Selecione a área</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>{area.nome}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={processo.nome}
              onChange={e => handleChange("nome", e.target.value)}
              placeholder="Processo de Tecelagem"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              value={processo.codigo || ""}
              onChange={e => handleChange("codigo", e.target.value)}
              placeholder="PR-001"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={processo.status}
              onChange={e => handleChange("status", e.target.value)}
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
            >
              {Object.entries(PROCESSO_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="versao">Versão</Label>
            <Input
              id="versao"
              type="number"
              min={0}
              value={processo.versao}
              onChange={e => handleChange("versao", e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Input
              id="responsavel"
              value={processo.responsavel || ""}
              onChange={e => handleChange("responsavel", e.target.value)}
              placeholder="Nome do responsável"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="objetivo">Objetivo</Label>
          <Textarea
            id="objetivo"
            value={processo.objetivo || ""}
            onChange={e => handleChange("objetivo", e.target.value)}
            placeholder="Objetivo do processo"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LISTAS.map(({ campo, label }) => (
            <div className="space-y-2" key={campo}>
              <Label htmlFor={campo}>{label}</Label>
              <Textarea
                id={campo}
                value={String(processo[campo] || "")}
                onChange={e => handleChange(campo, e.target.value)}
                placeholder="Item por linha"
                rows={2}
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="indicadores">Indicadores (JSON — lista de objetos)</Label>
          <Textarea
            id="indicadores"
            value={processo.indicadores}
            onChange={e => handleChange("indicadores", e.target.value)}
            placeholder={`[{"nome":"OEE","meta":"95%"}]`}
            rows={3}
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="riscos">Riscos (JSON — lista de objetos)</Label>
          <Textarea
            id="riscos"
            value={processo.riscos}
            onChange={e => handleChange("riscos", e.target.value)}
            placeholder={`[{"nome":"Falha de máquina","nivel":"Médio"}]`}
            rows={3}
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="controles">Controles (JSON — lista de objetos)</Label>
          <Textarea
            id="controles"
            value={processo.controles}
            onChange={e => handleChange("controles", e.target.value)}
            placeholder={`[{"nome":"Manutenção preventiva"}]`}
            rows={3}
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            value={processo.observacoes || ""}
            onChange={e => handleChange("observacoes", e.target.value)}
            placeholder="Observações gerais"
            rows={2}
          />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" checked={processo.ativo} onChange={e => handleChange("ativo", e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="ativo">Ativo</Label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
          <Link href="/processos/processos">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>

      {isEditing && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <ListOrdered size={18} className="text-slate-400" />
                Subprocessos
              </h2>
              <Link href={`/processos/subprocessos/novo?processoId=${id}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <PlusCircle size={14} />
                  Novo
                </Button>
              </Link>
            </div>
            {subprocessos.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum subprocesso cadastrado.</p>
            ) : (
              <ul className="space-y-2">
                {subprocessos.map((sub) => (
                  <li key={sub.id}>
                    <Link
                      href={`/processos/subprocessos/${sub.id}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <span>{sub.nome}</span>
                      <span className="text-xs text-slate-400">ordem {sub.ordem}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <ListOrdered size={18} className="text-slate-400" />
                Atividades
              </h2>
              <Link href={`/processos/atividades/novo?processoId=${id}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <PlusCircle size={14} />
                  Nova
                </Button>
              </Link>
            </div>
            {atividades.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma atividade cadastrada.</p>
            ) : (
              <ul className="space-y-2">
                {atividades.map((atv) => (
                  <li key={atv.id}>
                    <Link
                      href={`/processos/atividades/${atv.id}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <span>{atv.nome}</span>
                      <span className="text-xs text-slate-400">{atv.subprocessoNome || `Subprocesso #${atv.subprocessoId}`}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}