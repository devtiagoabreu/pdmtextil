"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useParams, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  calcularDepreciacao,
  formatarMoeda,
  formatarPercentual,
  formatarDataISO,
} from "@/lib/ativos/depreciacao"

const STATUS = ["ATIVO", "MANUTENCAO", "INATIVO", "BAIXADO"] as const

interface Categoria {
  id: number
  nome: string
}

interface Usuario {
  id: number
  name: string
  role: string
}

type Ativo = {
  id: number | null
  codigo: string
  nome: string
  categoriaId: string
  localizacao: string
  fabricante: string
  modelo: string
  numSerie: string
  anoFabricacao: string
  dataAquisicao: string
  valorAquisicao: string
  valorResidual: string
  vidaUtilAnos: string
  status: string
  maquinaId: string
  responsavelId: string
  descricao: string
  observacoes: string
  ativo: boolean
}

const INITIAL: Ativo = {
  id: null,
  codigo: "",
  nome: "",
  categoriaId: "",
  localizacao: "",
  fabricante: "",
  modelo: "",
  numSerie: "",
  anoFabricacao: "",
  dataAquisicao: "",
  valorAquisicao: "",
  valorResidual: "",
  vidaUtilAnos: "",
  status: "ATIVO",
  maquinaId: "",
  responsavelId: "",
  descricao: "",
  observacoes: "",
  ativo: true,
}

type AtivoReformaItem = {
  id: number | null
  data: string
  valor: string
  extensaoVidaUtilAnos: string
  motivo: string
  descricao: string
}

const REFORMA_VAZIA: AtivoReformaItem = {
  id: null,
  data: "",
  valor: "",
  extensaoVidaUtilAnos: "",
  motivo: "",
  descricao: "",
}

export default function AtivoFormPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [ativo, setAtivo] = useState<Ativo>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [reformas, setReformas] = useState<AtivoReformaItem[]>([])
  const [reformaForm, setReformaForm] = useState<AtivoReformaItem>(REFORMA_VAZIA)
  const [salvandoReforma, setSalvandoReforma] = useState(false)

  const { data: categorias = [] } = useQuery<Categoria[]>({
    queryKey: ["ativos-categorias"],
    queryFn: async () => {
      const res = await fetch("/api/ativos/categorias")
      if (!res.ok) throw new Error("Falha ao carregar categorias")
      return res.json()
    },
  })

  const { data: usuarios = [] } = useQuery<Usuario[]>({
    queryKey: ["usuarios-ativos"],
    queryFn: async () => {
      const res = await fetch("/api/usuarios/ativos")
      if (!res.ok) throw new Error("Falha ao carregar usuários")
      return res.json()
    },
  })

  const { data: ativoData, isLoading: loading } = useQuery<
    Partial<Ativo> & { reformas?: AtivoReformaItem[] }
  >({
    queryKey: ["ativos-ativo", id],
    queryFn: async () => {
      const res = await fetch(`/api/ativos/${id}`)
      return res.json()
    },
    enabled: !!isEditing && !!id,
  })

  useEffect(() => {
    if (ativoData) {
      setAtivo({
        id: (ativoData.id as number) ?? null,
        codigo: ativoData.codigo || "",
        nome: ativoData.nome || "",
        categoriaId: ativoData.categoriaId ? String(ativoData.categoriaId) : "",
        localizacao: ativoData.localizacao || "",
        fabricante: ativoData.fabricante || "",
        modelo: ativoData.modelo || "",
        numSerie: ativoData.numSerie || "",
        anoFabricacao: ativoData.anoFabricacao ? String(ativoData.anoFabricacao) : "",
        dataAquisicao: ativoData.dataAquisicao || "",
        valorAquisicao: ativoData.valorAquisicao != null ? String(ativoData.valorAquisicao) : "",
        valorResidual: ativoData.valorResidual != null ? String(ativoData.valorResidual) : "",
        vidaUtilAnos: ativoData.vidaUtilAnos != null ? String(ativoData.vidaUtilAnos) : "",
        status: ativoData.status || "ATIVO",
        maquinaId: ativoData.maquinaId ? String(ativoData.maquinaId) : "",
        responsavelId: ativoData.responsavelId ? String(ativoData.responsavelId) : "",
        descricao: ativoData.descricao || "",
        observacoes: ativoData.observacoes || "",
        ativo: ativoData.ativo ?? true,
      })
      const reformasApi = ativoData?.reformas
      if (reformasApi) {
        setReformas(
          reformasApi.map((r) => ({
            ...r,
            valor: r.valor != null ? String(r.valor) : "",
            extensaoVidaUtilAnos:
              r.extensaoVidaUtilAnos != null ? String(r.extensaoVidaUtilAnos) : "",
          }))
        )
      }
    }
  }, [ativoData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!ativo.codigo) {
      toast.error("Código é obrigatório")
      return
    }
    if (!ativo.nome) {
      toast.error("Nome é obrigatório")
      return
    }
    if (!ativo.categoriaId) {
      toast.error("Selecione a categoria")
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/ativos/${id}` : "/api/ativos"
      const method = isEditing ? "PUT" : "POST"

      const body: Record<string, unknown> = {
        codigo: ativo.codigo,
        nome: ativo.nome,
        categoriaId: parseInt(ativo.categoriaId),
        localizacao: ativo.localizacao || null,
        fabricante: ativo.fabricante || null,
        modelo: ativo.modelo || null,
        numSerie: ativo.numSerie || null,
        anoFabricacao: ativo.anoFabricacao ? parseInt(ativo.anoFabricacao) : null,
        dataAquisicao: ativo.dataAquisicao || null,
        valorAquisicao: ativo.valorAquisicao ? Number(ativo.valorAquisicao) : null,
        valorResidual: ativo.valorResidual ? Number(ativo.valorResidual) : null,
        vidaUtilAnos: ativo.vidaUtilAnos ? parseInt(ativo.vidaUtilAnos, 10) : null,
        status: ativo.status,
        maquinaId: ativo.maquinaId ? parseInt(ativo.maquinaId) : null,
        responsavelId: ativo.responsavelId ? parseInt(ativo.responsavelId) : null,
        observacoes: ativo.observacoes || null,
        ativo: ativo.ativo,
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(isEditing ? "Ativo atualizado!" : "Ativo criado!")
        router.push("/ativos/ativos")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao salvar ativo")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Ativo, value: string | boolean) => {
    setAtivo((prev) => ({ ...prev, [field]: value }))
  }

  const reformasCalculo = reformas
    .filter((r) => r.data && r.extensaoVidaUtilAnos && parseInt(r.extensaoVidaUtilAnos, 10) > 0)
    .map((r) => ({
      data: r.data,
      valor: r.valor ? Number(r.valor) : 0,
      extensaoVidaUtilAnos: parseInt(r.extensaoVidaUtilAnos, 10) || 0,
    }))

  const salvarReforma = async () => {
    if (!reformaForm.data) {
      toast.error("Informe a data da reforma")
      return
    }
    if (!id) return
    setSalvandoReforma(true)
    try {
      const url = reformaForm.id
        ? `/api/ativos/${id}/reformas/${reformaForm.id}`
        : `/api/ativos/${id}/reformas`
      const method = reformaForm.id ? "PUT" : "POST"
      const body = {
        data: reformaForm.data,
        valor: reformaForm.valor ? Number(reformaForm.valor) : null,
        extensaoVidaUtilAnos: reformaForm.extensaoVidaUtilAnos
          ? parseInt(reformaForm.extensaoVidaUtilAnos, 10)
          : null,
        motivo: reformaForm.motivo || null,
        descricao: reformaForm.descricao || null,
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const nova = await res.json()
        toast.success(reformaForm.id ? "Reforma atualizada!" : "Reforma registrada!")
        const normalizada: AtivoReformaItem = {
          id: nova.id ?? null,
          data: nova.data || "",
          valor: nova.valor != null ? String(nova.valor) : "",
          extensaoVidaUtilAnos:
            nova.extensaoVidaUtilAnos != null ? String(nova.extensaoVidaUtilAnos) : "",
          motivo: nova.motivo || "",
          descricao: nova.descricao || "",
        }
        setReformas((prev) => {
          if (reformaForm.id) {
            return prev.map((r) => (r.id === normalizada.id ? normalizada : r))
          }
          return [...prev, normalizada]
        })
        setReformaForm(REFORMA_VAZIA)
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar reforma")
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao salvar reforma")
    } finally {
      setSalvandoReforma(false)
    }
  }

  const excluirReforma = async (reforma: AtivoReformaItem) => {
    if (!reforma.id || !id) return
    if (!window.confirm(`Excluir reforma de ${formatarDataISO(reforma.data)}?`)) return
    try {
      const res = await fetch(`/api/ativos/${id}/reformas/${reforma.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Reforma excluída!")
        setReformas((prev) => prev.filter((r) => r.id !== reforma.id))
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao excluir reforma")
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao excluir reforma")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/ativos/ativos">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Ativo" : "Novo Ativo"}
            {info && <InfoButton content={info} />}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="codigo" className="font-medium">
              Código
            </Label>
            <Input
              id="codigo"
              value={ativo.codigo}
              onChange={(e) => handleChange("codigo", e.target.value)}
              placeholder="EXT-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome" className="font-medium">
              Nome
            </Label>
            <Input
              id="nome"
              value={ativo.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Extintor de incêndio"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="categoriaId" className="font-medium">
              Categoria
            </Label>
            <select
              id="categoriaId"
              value={ativo.categoriaId}
              onChange={(e) => handleChange("categoriaId", e.target.value)}
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
              required
            >
              <option value="">Selecione a categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="localizacao" className="font-medium">
              Localização
            </Label>
            <Input
              id="localizacao"
              value={ativo.localizacao}
              onChange={(e) => handleChange("localizacao", e.target.value)}
              placeholder="Galpão A — Setor 2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="fabricante" className="font-medium">
              Fabricante
            </Label>
            <Input
              id="fabricante"
              value={ativo.fabricante}
              onChange={(e) => handleChange("fabricante", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelo" className="font-medium">
              Modelo
            </Label>
            <Input
              id="modelo"
              value={ativo.modelo}
              onChange={(e) => handleChange("modelo", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numSerie" className="font-medium">
              Nº de Série
            </Label>
            <Input
              id="numSerie"
              value={ativo.numSerie}
              onChange={(e) => handleChange("numSerie", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="anoFabricacao" className="font-medium">
              Ano de Fabricação
            </Label>
            <Input
              id="anoFabricacao"
              type="number"
              min={1900}
              max={2100}
              value={ativo.anoFabricacao}
              onChange={(e) => handleChange("anoFabricacao", e.target.value)}
              placeholder="2020"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="font-medium">
              Status
            </Label>
            <select
              id="status"
              value={ativo.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
            >
              {STATUS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maquinaId" className="font-medium">
              Máquina (ID)
            </Label>
            <Input
              id="maquinaId"
              type="number"
              value={ativo.maquinaId}
              onChange={(e) => handleChange("maquinaId", e.target.value)}
              placeholder="10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsavelId" className="font-medium">
            Responsável
          </Label>
          <select
            id="responsavelId"
            value={ativo.responsavelId}
            onChange={(e) => handleChange("responsavelId", e.target.value)}
            className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
          >
            <option value="">Sem responsável</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.name} ({usuario.role})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="dataAquisicao" className="font-medium">
              Data de Aquisição
            </Label>
            <Input
              id="dataAquisicao"
              type="date"
              value={ativo.dataAquisicao}
              onChange={(e) => handleChange("dataAquisicao", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorAquisicao" className="font-medium">
              Valor de Aquisição (R$)
            </Label>
            <Input
              id="valorAquisicao"
              type="number"
              step="0.01"
              min="0"
              value={ativo.valorAquisicao}
              onChange={(e) => handleChange("valorAquisicao", e.target.value)}
              placeholder="12.000,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorResidual" className="font-medium">
              Valor Residual (R$)
            </Label>
            <Input
              id="valorResidual"
              type="number"
              step="0.01"
              min="0"
              value={ativo.valorResidual}
              onChange={(e) => handleChange("valorResidual", e.target.value)}
              placeholder="2.000,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vidaUtilAnos" className="font-medium">
              Vida Útil (anos)
            </Label>
            <Input
              id="vidaUtilAnos"
              type="number"
              min="1"
              max="100"
              value={ativo.vidaUtilAnos}
              onChange={(e) => handleChange("vidaUtilAnos", e.target.value)}
              placeholder="5"
            />
          </div>
        </div>

        {ativo.valorAquisicao &&
          ativo.vidaUtilAnos &&
          (() => {
            const calc = calcularDepreciacao({
              valorAquisicao: Number(ativo.valorAquisicao),
              valorResidual: ativo.valorResidual ? Number(ativo.valorResidual) : 0,
              vidaUtilAnos: parseInt(ativo.vidaUtilAnos, 10) || 0,
              dataAquisicao: ativo.dataAquisicao || null,
              dataReferencia: new Date(),
              reformas: reformasCalculo,
            })
            return (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Controle de Depreciação
                </h3>
                {calc.valorReformas > 0 && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      Custo total:{" "}
                      <span className="font-medium">{formatarMoeda(calc.custoTotal)}</span>
                    </span>
                    <span>
                      Reformas capitalizadas:{" "}
                      <span className="font-medium">{formatarMoeda(calc.valorReformas)}</span>
                    </span>
                    <span>
                      Vida útil total:{" "}
                      <span className="font-medium">
                        {calc.vidaUtilAnos} → {calc.vidaUtilAnosTotal} anos
                      </span>
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">
                      Base depreciável
                    </span>
                    <span className="font-medium">{formatarMoeda(calc.baseDepreciavel)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">
                      Depreciação mensal
                    </span>
                    <span className="font-medium">{formatarMoeda(calc.depreciacaoMensal)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">
                      Depreciação anual
                    </span>
                    <span className="font-medium">{formatarMoeda(calc.depreciacaoAnual)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Vida útil</span>
                    <span className="font-medium">
                      {calc.mesesVidaUtil} meses ({calc.vidaUtilAnos} anos)
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 text-sm border-t border-slate-200 dark:border-slate-700 pt-4">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Acumulada</span>
                    <span className="font-semibold text-blue-700 dark:text-blue-400">
                      {formatarMoeda(calc.depreciacaoAcumulada)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Faltante</span>
                    <span className="font-medium">{formatarMoeda(calc.faltanteDepreciar)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Valor contábil</span>
                    <span className="font-semibold">{formatarMoeda(calc.valorContabil)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">% Depreciado</span>
                    <span className="font-medium">
                      {formatarPercentual(calc.percentualDepreciado)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">
                      Fim da vida útil
                    </span>
                    <span className="font-medium">{formatarDataISO(calc.dataFim)}</span>
                  </div>
                </div>
                {calc.totalmenteDepreciado && (
                  <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    Totalmente depreciado
                  </span>
                )}
                {calc.totalmenteDepreciado && (
                  <p className="text-xs leading-relaxed text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-md p-3">
                    O ativo está <span className="font-semibold">totalmente depreciado</span>. Para
                    reativar a depreciação, registre uma reforma capitalizável (com extensão de vida
                    útil) na seção Reformas — o valor soma ao custo e o cálculo recomeça sobre a
                    nova vida útil.
                  </p>
                )}
                {calc.deprecia && !calc.totalmenteDepreciado && (
                  <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Em depreciação — {calc.mesesDecorridos}/{calc.mesesVidaUtil} meses
                  </span>
                )}
                {!calc.deprecia && (
                  <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Informe valor de aquisição, residual, vida útil e data para calcular
                  </span>
                )}
                {calc.lancamentos.length > 0 && (
                  <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-700 pt-3">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                      Projeção anual
                    </p>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left p-1.5 font-medium text-slate-500 dark:text-slate-400">
                            Ano
                          </th>
                          <th className="text-center p-1.5 font-medium text-slate-500 dark:text-slate-400">
                            Meses
                          </th>
                          <th className="text-right p-1.5 font-medium text-slate-500 dark:text-slate-400">
                            Depreciação
                          </th>
                          <th className="text-right p-1.5 font-medium text-slate-500 dark:text-slate-400">
                            Acumulada
                          </th>
                          <th className="text-right p-1.5 font-medium text-slate-500 dark:text-slate-400">
                            Valor contábil
                          </th>
                          <th className="text-right p-1.5 font-medium text-slate-500 dark:text-slate-400">
                            %
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {calc.lancamentos.map((l) => (
                          <tr
                            key={l.ano}
                            className="border-b border-slate-100 dark:border-slate-800"
                          >
                            <td className="p-1.5 font-medium">{l.ano}</td>
                            <td className="p-1.5 text-center">{l.meses}</td>
                            <td className="p-1.5 text-right">{formatarMoeda(l.depreciacaoAno)}</td>
                            <td className="p-1.5 text-right">
                              {formatarMoeda(l.depreciacaoAcumulada)}
                            </td>
                            <td className="p-1.5 text-right">{formatarMoeda(l.valorContabil)}</td>
                            <td className="p-1.5 text-right">
                              {formatarPercentual(l.percentualAcumulado)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })()}

        {isEditing && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Reformas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Reforma que estende a vida útil ou amplia a capacidade é capitalizada (soma ao custo
                e reativa a depreciação — CPC 27). Manutenção rotineira (extensão 0) não entra no
                cálculo.
              </p>
            </div>

            {reformas.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left p-1.5 font-medium text-slate-500 dark:text-slate-400">
                        Data
                      </th>
                      <th className="text-right p-1.5 font-medium text-slate-500 dark:text-slate-400">
                        Valor
                      </th>
                      <th className="text-center p-1.5 font-medium text-slate-500 dark:text-slate-400">
                        + Vida útil
                      </th>
                      <th className="text-left p-1.5 font-medium text-slate-500 dark:text-slate-400">
                        Motivo
                      </th>
                      <th className="text-right p-1.5 font-medium text-slate-500 dark:text-slate-400" />
                    </tr>
                  </thead>
                  <tbody>
                    {reformas.map((r) => (
                      <tr
                        key={r.id ?? "novo"}
                        className="border-b border-slate-100 dark:border-slate-800"
                      >
                        <td className="p-1.5">{formatarDataISO(r.data || "")}</td>
                        <td className="p-1.5 text-right">{formatarMoeda(Number(r.valor) || 0)}</td>
                        <td className="p-1.5 text-center">
                          {r.extensaoVidaUtilAnos ? `${r.extensaoVidaUtilAnos} ano(s)` : "—"}
                        </td>
                        <td className="p-1.5">{r.motivo || "—"}</td>
                        <td className="p-1.5 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setReformaForm({ ...r })}
                            >
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-600 dark:text-red-400"
                              onClick={() => excluirReforma(r)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="reformaData" className="text-xs">
                  Data
                </Label>
                <Input
                  id="reformaData"
                  type="date"
                  value={reformaForm.data}
                  onChange={(e) => setReformaForm((p) => ({ ...p, data: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reformaValor" className="text-xs">
                  Valor (R$)
                </Label>
                <Input
                  id="reformaValor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={reformaForm.valor}
                  onChange={(e) => setReformaForm((p) => ({ ...p, valor: e.target.value }))}
                  placeholder="3.000,00"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reformaExtensao" className="text-xs">
                  Extensão de vida (anos)
                </Label>
                <Input
                  id="reformaExtensao"
                  type="number"
                  min="0"
                  max="100"
                  value={reformaForm.extensaoVidaUtilAnos}
                  onChange={(e) =>
                    setReformaForm((p) => ({ ...p, extensaoVidaUtilAnos: e.target.value }))
                  }
                  placeholder="2"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reformaMotivo" className="text-xs">
                  Motivo
                </Label>
                <Input
                  id="reformaMotivo"
                  value={reformaForm.motivo}
                  onChange={(e) => setReformaForm((p) => ({ ...p, motivo: e.target.value }))}
                  placeholder="Beneficiamento (CPC 27)"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={salvandoReforma}
                onClick={salvarReforma}
                className="gap-2"
              >
                {salvandoReforma && <Loader2 size={14} className="animate-spin" />}
                {reformaForm.id ? "Atualizar reforma" : "Registrar reforma"}
              </Button>
              {reformaForm.id && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setReformaForm(REFORMA_VAZIA)}
                >
                  Cancelar edição
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="descricao" className="font-medium">
            Descrição
          </Label>
          <Textarea
            id="descricao"
            value={ativo.descricao}
            onChange={(e) => handleChange("descricao", e.target.value)}
            placeholder="Descrição do ativo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes" className="font-medium">
            Observações
          </Label>
          <Textarea
            id="observacoes"
            value={ativo.observacoes}
            onChange={(e) => handleChange("observacoes", e.target.value)}
            placeholder="Observações adicionais"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ativo"
            checked={ativo.ativo}
            onChange={(e) => handleChange("ativo", e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="ativo">Ativo</Label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
          <Link href="/ativos/ativos">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
