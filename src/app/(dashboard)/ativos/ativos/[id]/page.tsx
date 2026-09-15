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

const STATUS = ["ATIVO", "MANUTENCAO", "INATIVO", "BAIXADO"] as const

interface Categoria {
  id: number
  nome: string
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
  status: "ATIVO",
  maquinaId: "",
  responsavelId: "",
  descricao: "",
  observacoes: "",
  ativo: true,
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

  const { data: categorias = [] } = useQuery<Categoria[]>({
    queryKey: ["ativos-categorias"],
    queryFn: async () => {
      const res = await fetch("/api/ativos/categorias")
      if (!res.ok) throw new Error("Falha ao carregar categorias")
      return res.json()
    },
  })

  const { data: ativoData, isLoading: loading } = useQuery<Partial<Ativo>>({
    queryKey: ["ativos-ativo", id],
    queryFn: async () => {
      const res = await fetch(`/api/ativos/ativos/${id}`)
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
        status: ativoData.status || "ATIVO",
        maquinaId: ativoData.maquinaId ? String(ativoData.maquinaId) : "",
        responsavelId: ativoData.responsavelId ? String(ativoData.responsavelId) : "",
        descricao: ativoData.descricao || "",
        observacoes: ativoData.observacoes || "",
        ativo: ativoData.ativo ?? true,
      })
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
      const url = isEditing ? `/api/ativos/ativos/${id}` : "/api/ativos/ativos"
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
    setAtivo(prev => ({ ...prev, [field]: value }))
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
            <Label htmlFor="codigo" className="font-medium">Código</Label>
            <Input
              id="codigo"
              value={ativo.codigo}
              onChange={e => handleChange("codigo", e.target.value)}
              placeholder="EXT-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome" className="font-medium">Nome</Label>
            <Input
              id="nome"
              value={ativo.nome}
              onChange={e => handleChange("nome", e.target.value)}
              placeholder="Extintor de incêndio"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="categoriaId" className="font-medium">Categoria</Label>
            <select
              id="categoriaId"
              value={ativo.categoriaId}
              onChange={e => handleChange("categoriaId", e.target.value)}
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
              required
            >
              <option value="">Selecione a categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="localizacao" className="font-medium">Localização</Label>
            <Input
              id="localizacao"
              value={ativo.localizacao}
              onChange={e => handleChange("localizacao", e.target.value)}
              placeholder="Galpão A — Setor 2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="fabricante" className="font-medium">Fabricante</Label>
            <Input
              id="fabricante"
              value={ativo.fabricante}
              onChange={e => handleChange("fabricante", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelo" className="font-medium">Modelo</Label>
            <Input
              id="modelo"
              value={ativo.modelo}
              onChange={e => handleChange("modelo", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numSerie" className="font-medium">Nº de Série</Label>
            <Input
              id="numSerie"
              value={ativo.numSerie}
              onChange={e => handleChange("numSerie", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="anoFabricacao" className="font-medium">Ano de Fabricação</Label>
            <Input
              id="anoFabricacao"
              type="number"
              min={1900}
              max={2100}
              value={ativo.anoFabricacao}
              onChange={e => handleChange("anoFabricacao", e.target.value)}
              placeholder="2020"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="font-medium">Status</Label>
            <select
              id="status"
              value={ativo.status}
              onChange={e => handleChange("status", e.target.value)}
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
            >
              {STATUS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maquinaId" className="font-medium">Máquina (ID)</Label>
            <Input
              id="maquinaId"
              type="number"
              value={ativo.maquinaId}
              onChange={e => handleChange("maquinaId", e.target.value)}
              placeholder="10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsavelId" className="font-medium">Responsável (ID)</Label>
          <Input
            id="responsavelId"
            type="number"
            value={ativo.responsavelId}
            onChange={e => handleChange("responsavelId", e.target.value)}
            placeholder="3"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao" className="font-medium">Descrição</Label>
          <Textarea
            id="descricao"
            value={ativo.descricao}
            onChange={e => handleChange("descricao", e.target.value)}
            placeholder="Descrição do ativo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes" className="font-medium">Observações</Label>
          <Textarea
            id="observacoes"
            value={ativo.observacoes}
            onChange={e => handleChange("observacoes", e.target.value)}
            placeholder="Observações adicionais"
          />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" checked={ativo.ativo} onChange={e => handleChange("ativo", e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="ativo">Ativo</Label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
          <Link href="/ativos/ativos">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}