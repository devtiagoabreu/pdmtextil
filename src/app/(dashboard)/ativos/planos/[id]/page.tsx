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
import { toast } from "sonner"

interface Ativo {
  id: number
  nome: string
  codigo: string
}

interface TipoVistoria {
  id: number
  nome: string
}

type PlanoVistoria = {
  id: number | null
  ativoId: string
  tipoVistoriaId: string
  responsavelId: string
  diasIntervalo: string
  proximaData: string
  ativo: boolean
}

export default function PlanoVistoriaFormPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [plano, setPlano] = useState<PlanoVistoria>({
    id: null,
    ativoId: "",
    tipoVistoriaId: "",
    responsavelId: "",
    diasIntervalo: "",
    proximaData: "",
    ativo: true,
  })
  const [saving, setSaving] = useState(false)

  const { data: ativos = [] } = useQuery<Ativo[]>({
    queryKey: ["ativos-ativos"],
    queryFn: async () => {
      const res = await fetch("/api/ativos/ativos")
      if (!res.ok) throw new Error("Falha ao carregar ativos")
      return res.json()
    },
  })

  const { data: tiposVistoria = [] } = useQuery<TipoVistoria[]>({
    queryKey: ["ativos-tipos-vistoria"],
    queryFn: async () => {
      const res = await fetch("/api/ativos/tipos-vistoria")
      if (!res.ok) throw new Error("Falha ao carregar tipos de vistoria")
      return res.json()
    },
  })

  const { data: planoData, isLoading: loading } = useQuery<Partial<PlanoVistoria>>({
    queryKey: ["ativos-plano", id],
    queryFn: async () => {
      const res = await fetch(`/api/ativos/planos/${id}`)
      return res.json()
    },
    enabled: !!isEditing && !!id,
  })

  useEffect(() => {
    if (planoData) {
      setPlano({
        id: (planoData.id as number) ?? null,
        ativoId: planoData.ativoId ? String(planoData.ativoId) : "",
        tipoVistoriaId: planoData.tipoVistoriaId ? String(planoData.tipoVistoriaId) : "",
        responsavelId: planoData.responsavelId ? String(planoData.responsavelId) : "",
        diasIntervalo: planoData.diasIntervalo ? String(planoData.diasIntervalo) : "",
        proximaData: planoData.proximaData ? String(planoData.proximaData).slice(0, 10) : "",
        ativo: planoData.ativo ?? true,
      })
    }
  }, [planoData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!plano.ativoId) {
      toast.error("Selecione o ativo")
      return
    }
    if (!plano.tipoVistoriaId) {
      toast.error("Selecione o tipo de vistoria")
      return
    }
    if (!plano.proximaData) {
      toast.error("Informe a próxima data")
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/ativos/planos/${id}` : "/api/ativos/planos"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ativoId: parseInt(plano.ativoId),
          tipoVistoriaId: parseInt(plano.tipoVistoriaId),
          responsavelId: plano.responsavelId ? parseInt(plano.responsavelId) : null,
          diasIntervalo: plano.diasIntervalo ? parseInt(plano.diasIntervalo) : null,
          proximaData: plano.proximaData,
          ativo: plano.ativo,
        }),
      })

      if (res.ok) {
        toast.success(isEditing ? "Plano atualizado!" : "Plano criado!")
        router.push("/ativos/planos")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao salvar plano")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof PlanoVistoria, value: string | boolean) => {
    setPlano(prev => ({ ...prev, [field]: value }))
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
        <Link href="/ativos/planos">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Plano de Vistoria" : "Novo Plano de Vistoria"}
            {info && <InfoButton content={info} />}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ativoId" className="font-medium">Ativo</Label>
            <select
              id="ativoId"
              value={plano.ativoId}
              onChange={e => handleChange("ativoId", e.target.value)}
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
              required
            >
              <option value="">Selecione o ativo</option>
              {ativos.map((ativo) => (
                <option key={ativo.id} value={ativo.id}>{ativo.codigo} — {ativo.nome}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipoVistoriaId" className="font-medium">Tipo de Vistoria</Label>
            <select
              id="tipoVistoriaId"
              value={plano.tipoVistoriaId}
              onChange={e => handleChange("tipoVistoriaId", e.target.value)}
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
              required
            >
              <option value="">Selecione o tipo</option>
              {tiposVistoria.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="responsavelId" className="font-medium">Responsável (ID)</Label>
            <Input
              id="responsavelId"
              type="number"
              value={plano.responsavelId}
              onChange={e => handleChange("responsavelId", e.target.value)}
              placeholder="3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diasIntervalo" className="font-medium">Intervalo (dias)</Label>
            <Input
              id="diasIntervalo"
              type="number"
              min={1}
              value={plano.diasIntervalo}
              onChange={e => handleChange("diasIntervalo", e.target.value)}
              placeholder="30"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="proximaData" className="font-medium">Próxima Data</Label>
          <Input
            id="proximaData"
            type="date"
            value={plano.proximaData}
            onChange={e => handleChange("proximaData", e.target.value)}
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" checked={plano.ativo} onChange={e => handleChange("ativo", e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="ativo">Ativo</Label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
          <Link href="/ativos/planos">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}