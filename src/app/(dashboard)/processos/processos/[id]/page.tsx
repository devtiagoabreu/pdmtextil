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
import { ListaEditor } from "@/components/processos/lista-editor"
import { ListaTexto } from "@/components/processos/lista-texto"
import { CampoInfo } from "@/components/processos/campo-info"
import { LinksEditor } from "@/components/links/LinksEditor"
import { toast } from "sonner"
import { PROCESSO_STATUS_LABELS, statusLabel, STATUS_COLORS } from "@/lib/processos/constantes"
import { processoCampos } from "@/lib/info-content/engenharia"
import type { InfoContent } from "@/lib/info-content"

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
  entradas: string[]
  saidas: string[]
  fornecedores: string[]
  clientes: string[]
  recursos: string[]
  sistemas: string[]
  equipamentos: string[]
  indicadores: LinhaIndicador[]
  riscos: LinhaRisco[]
  controles: LinhaControle[]
  links: LinhaLink[]
  observacoes: string
  ativo: boolean
}

interface LinhaIndicador {
  nome: string
  unidade: string
  meta: string
  frequencia: string
}

interface LinhaRisco {
  descricao: string
  probabilidade: string
  impacto: string
  controle: string
}

interface LinhaControle {
  descricao: string
  responsavel: string
  frequencia: string
}

interface LinhaLink {
  url: string
  descricao: string
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
  entradas: [],
  saidas: [],
  fornecedores: [],
  clientes: [],
  recursos: [],
  sistemas: [],
  equipamentos: [],
  indicadores: [],
  riscos: [],
  controles: [],
  links: [],
  observacoes: "",
  ativo: true,
}

const NOVO_INDICADOR: LinhaIndicador = { nome: "", unidade: "", meta: "", frequencia: "" }
const NOVO_RISCO: LinhaRisco = { descricao: "", probabilidade: "", impacto: "", controle: "" }
const NOVO_CONTROLE: LinhaControle = { descricao: "", responsavel: "", frequencia: "" }

const CAMPOS_INDICADOR = [
  {
    campo: "nome",
    label: "Nome",
    placeholder: "Ex: Atraso de entrega",
    className: "sm:col-span-2",
  },
  { campo: "unidade", label: "Unidade", placeholder: "Ex: %" },
  { campo: "meta", label: "Meta", placeholder: "Ex: < 3%" },
  {
    campo: "frequencia",
    label: "Frequência",
    placeholder: "Ex: semanal",
    className: "sm:col-span-2",
  },
]

const CAMPOS_RISCO = [
  {
    campo: "descricao",
    label: "Descrição",
    placeholder: "Ex: Produto divergente do pedido",
    className: "sm:col-span-2",
  },
  { campo: "probabilidade", label: "Probabilidade", placeholder: "Ex: Média" },
  { campo: "impacto", label: "Impacto", placeholder: "Ex: Alta" },
  {
    campo: "controle",
    label: "Ação de controle",
    placeholder: "Ex: Conferência no recebimento",
    className: "sm:col-span-2",
  },
]

const CAMPOS_CONTROLE = [
  {
    campo: "descricao",
    label: "Descrição",
    placeholder: "Ex: Conferência de peso e rolos",
    className: "sm:col-span-2",
  },
  { campo: "responsavel", label: "Responsável", placeholder: "Ex: Conferente" },
  { campo: "frequencia", label: "Frequência", placeholder: "Ex: a cada recebimento" },
]

type CampoListaTexto =
  "entradas" | "saidas" | "fornecedores" | "clientes" | "recursos" | "sistemas" | "equipamentos"

const LISTAS: {
  campo: CampoListaTexto
  titulo: string
  info: InfoContent
  placeholder: string
  rotulo: string
}[] = [
  {
    campo: "entradas",
    titulo: "Entradas",
    info: processoCampos.entradas,
    placeholder: "Ex.: Fio de algodão",
    rotulo: "Adicionar entrada",
  },
  {
    campo: "saidas",
    titulo: "Saídas",
    info: processoCampos.saidas,
    placeholder: "Ex.: Tecido acabado",
    rotulo: "Adicionar saída",
  },
  {
    campo: "fornecedores",
    titulo: "Fornecedores",
    info: processoCampos.fornecedores,
    placeholder: "Ex.: Fornecedor de fios",
    rotulo: "Adicionar fornecedor",
  },
  {
    campo: "clientes",
    titulo: "Clientes",
    info: processoCampos.clientes,
    placeholder: "Ex.: Corte e costura",
    rotulo: "Adicionar cliente",
  },
  {
    campo: "recursos",
    titulo: "Recursos",
    info: processoCampos.recursos,
    placeholder: "Ex.: Operadores",
    rotulo: "Adicionar recurso",
  },
  {
    campo: "sistemas",
    titulo: "Sistemas",
    info: processoCampos.sistemas,
    placeholder: "Ex.: ERP (PDM)",
    rotulo: "Adicionar sistema",
  },
  {
    campo: "equipamentos",
    titulo: "Equipamentos",
    info: processoCampos.equipamentos,
    placeholder: "Ex.: Autoclave",
    rotulo: "Adicionar equipamento",
  },
]

function arrayTexto(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  return valor.map((v) => String(v ?? "")).filter(Boolean)
}

function texto(obj?: unknown, campo?: string): string {
  if (!obj || typeof obj !== "object") return ""
  const v = (obj as Record<string, unknown>)[campo ?? ""]
  return v == null ? "" : String(v)
}

function normalizarIndicadores(valor: unknown): LinhaIndicador[] {
  if (!Array.isArray(valor)) return []
  return valor.map((i) => ({
    nome: texto(i, "nome"),
    unidade: texto(i, "unidade"),
    meta: texto(i, "meta"),
    frequencia: texto(i, "frequencia"),
  }))
}

function normalizarRiscos(valor: unknown): LinhaRisco[] {
  if (!Array.isArray(valor)) return []
  return valor.map((i) => ({
    descricao: texto(i, "descricao"),
    probabilidade: texto(i, "probabilidade"),
    impacto: texto(i, "impacto"),
    controle: texto(i, "controle"),
  }))
}

function normalizarControles(valor: unknown): LinhaControle[] {
  if (!Array.isArray(valor)) return []
  return valor.map((i) => ({
    descricao: texto(i, "descricao"),
    responsavel: texto(i, "responsavel"),
    frequencia: texto(i, "frequencia"),
  }))
}

function normalizarLinks(valor: unknown): LinhaLink[] {
  if (!Array.isArray(valor)) return []
  return valor.map((i) => ({
    url: texto(i, "url"),
    descricao: texto(i, "descricao"),
  }))
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
        entradas: arrayTexto(processoData.entradas),
        saidas: arrayTexto(processoData.saidas),
        fornecedores: arrayTexto(processoData.fornecedores),
        clientes: arrayTexto(processoData.clientes),
        recursos: arrayTexto(processoData.recursos),
        sistemas: arrayTexto(processoData.sistemas),
        equipamentos: arrayTexto(processoData.equipamentos),
        indicadores: normalizarIndicadores(processoData.indicadores),
        riscos: normalizarRiscos(processoData.riscos),
        controles: normalizarControles(processoData.controles),
        links: normalizarLinks(processoData.links),
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
        entradas: processo.entradas,
        saidas: processo.saidas,
        fornecedores: processo.fornecedores,
        clientes: processo.clientes,
        recursos: processo.recursos,
        sistemas: processo.sistemas,
        equipamentos: processo.equipamentos,
        indicadores: processo.indicadores,
        riscos: processo.riscos,
        controles: processo.controles,
        links: processo.links,
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
    setProcesso((prev) => ({ ...prev, [field]: value }))
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
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[processo.status] || STATUS_COLORS["RASCUNHO"]}`}
          >
            {statusLabel(processo.status)}
          </span>
          <span>versão {processo.versao || "0"}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <CampoInfo titulo="Área" sobre={processoCampos.areaId} htmlFor="areaId" obrigatorio />
          <select
            id="areaId"
            value={processo.areaId}
            onChange={(e) => handleChange("areaId", e.target.value)}
            className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
          >
            <option value="">Selecione a área</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <CampoInfo titulo="Nome" sobre={processoCampos.nome} htmlFor="nome" obrigatorio />
            <Input
              id="nome"
              value={processo.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Processo de Tecelagem"
              required
            />
          </div>
          <div className="space-y-2">
            <CampoInfo titulo="Código" sobre={processoCampos.codigo} htmlFor="codigo" />
            <Input
              id="codigo"
              value={processo.codigo || ""}
              onChange={(e) => handleChange("codigo", e.target.value)}
              placeholder="PR-001"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <CampoInfo titulo="Status" sobre={processoCampos.status} htmlFor="status" />
            <select
              id="status"
              value={processo.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
            >
              {Object.entries(PROCESSO_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <CampoInfo titulo="Versão" sobre={processoCampos.versao} htmlFor="versao" />
            <Input
              id="versao"
              type="number"
              min={0}
              value={processo.versao}
              onChange={(e) => handleChange("versao", e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <CampoInfo
              titulo="Responsável"
              sobre={processoCampos.responsavel}
              htmlFor="responsavel"
            />
            <Input
              id="responsavel"
              value={processo.responsavel || ""}
              onChange={(e) => handleChange("responsavel", e.target.value)}
              placeholder="Nome do responsável"
            />
          </div>
        </div>

        <div className="space-y-2">
          <CampoInfo titulo="Objetivo" sobre={processoCampos.objetivo} htmlFor="objetivo" />
          <Textarea
            id="objetivo"
            value={processo.objetivo || ""}
            onChange={(e) => handleChange("objetivo", e.target.value)}
            placeholder="Objetivo do processo"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LISTAS.map(({ campo, titulo, info, placeholder, rotulo }) => (
            <ListaTexto
              key={campo}
              titulo={titulo}
              baseId={campo}
              itens={processo[campo]}
              onChange={(itens) => setProcesso((p) => ({ ...p, [campo]: itens }))}
              rotuloAdicionar={rotulo}
              info={info}
              placeholderItem={placeholder}
              vazioTexto="Nenhum item adicionado."
            />
          ))}
        </div>

        <ListaEditor
          titulo="Indicadores"
          baseId="indicadores"
          campos={CAMPOS_INDICADOR}
          itens={processo.indicadores}
          onChange={(indicadores) => setProcesso((p) => ({ ...p, indicadores }))}
          criarItem={() => ({ ...NOVO_INDICADOR })}
          rotuloAdicionar="Adicionar indicador"
          info={processoCampos.indicadores}
          dica="Ex.: Atraso de entrega — meta < 3% — semanal."
          vazioTexto="Nenhum indicador cadastrado."
        />

        <ListaEditor
          titulo="Riscos"
          baseId="riscos"
          campos={CAMPOS_RISCO}
          itens={processo.riscos}
          onChange={(riscos) => setProcesso((p) => ({ ...p, riscos }))}
          criarItem={() => ({ ...NOVO_RISCO })}
          rotuloAdicionar="Adicionar risco"
          info={processoCampos.riscos}
          dica="Ex.: Produto divergente do pedido — probabilidade Média, impacto Alta, controle Conferência no recebimento."
          vazioTexto="Nenhum risco cadastrado."
        />

        <ListaEditor
          titulo="Controles"
          baseId="controles"
          campos={CAMPOS_CONTROLE}
          itens={processo.controles}
          onChange={(controles) => setProcesso((p) => ({ ...p, controles }))}
          criarItem={() => ({ ...NOVO_CONTROLE })}
          rotuloAdicionar="Adicionar controle"
          info={processoCampos.controles}
          dica="Ex.: Conferência de peso e rolos, conferência da nota fiscal vs. ordem de compra."
          vazioTexto="Nenhum controle cadastrado."
        />

        <LinksEditor
          links={processo.links}
          onChange={(links) => setProcesso((p) => ({ ...p, links }))}
        />

        <div className="space-y-2">
          <CampoInfo
            titulo="Observações"
            sobre={processoCampos.observacoes}
            htmlFor="observacoes"
          />
          <Textarea
            id="observacoes"
            value={processo.observacoes || ""}
            onChange={(e) => handleChange("observacoes", e.target.value)}
            placeholder="Observações gerais"
            rows={2}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ativo"
            checked={processo.ativo}
            onChange={(e) => handleChange("ativo", e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="ativo">Ativo</Label>
          <InfoButton content={processoCampos.ativo} />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
          <Link href="/processos/processos">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
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
                      <span className="text-xs text-slate-400">
                        {atv.subprocessoNome || `Subprocesso #${atv.subprocessoId}`}
                      </span>
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
