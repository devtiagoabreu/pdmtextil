"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useParams, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { ArrowLeft, Loader2, PlusCircle, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const SITE_ATIVOS = "Ativos e Vistorias"

interface AreaAtiva {
  id: number
  siteNome?: string | null
  nome: string
}

const PERIODICIDADES = [
  "DIARIA",
  "SEMANAL",
  "MENSAL",
  "TRIMESTRAL",
  "SEMESTRAL",
  "ANUAL",
  "BIENAL",
  "TRIENAL",
  "QUINQUENAL",
  "OUTRA",
] as const

const TIPOS_CHECKLIST = ["SIM_NAO", "OK_OBS", "VALOR", "TEXTO"] as const

interface ChecklistItem {
  pergunta: string
  tipo: "SIM_NAO" | "OK_OBS" | "VALOR" | "TEXTO"
  obrigatorio: boolean
}

type TipoVistoria = {
  id: number | null
  nome: string
  areaId: number | null
  periodicidade: string
  diasIntervalo: string
  baseLegal: string
  checklist: ChecklistItem[]
  ativo: boolean
}

export default function TipoVistoriaFormPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [tipo, setTipo] = useState<TipoVistoria>({
    id: null,
    nome: "",
    areaId: null,
    periodicidade: "MENSAL",
    diasIntervalo: "",
    baseLegal: "",
    checklist: [],
    ativo: true,
  })
  const [saving, setSaving] = useState(false)

  const { data: tipoData, isLoading: loading } = useQuery<Partial<TipoVistoria>>({
    queryKey: ["ativos-tipo-vistoria", id],
    queryFn: async () => {
      const res = await fetch(`/api/ativos/tipos-vistoria/${id}`)
      return res.json()
    },
    enabled: !!isEditing && !!id,
  })

  const { data: areasData = [] } = useQuery<AreaAtiva[]>({
    queryKey: ["processos-areas"],
    queryFn: async () => {
      const res = await fetch("/api/processos/areas")
      return res.json()
    },
  })
  const areas = areasData.filter((a) => a.siteNome === SITE_ATIVOS)
  useEffect(() => {
    if (tipo.areaId === null && areas.length > 0) {
      setTipo((prev) => ({ ...prev, areaId: areas[0].id }))
    }
  }, [areas, tipo.areaId])

  useEffect(() => {
    if (tipoData) {
      setTipo({
        id: (tipoData.id as number) ?? null,
        nome: tipoData.nome || "",
        areaId: tipoData.areaId ?? null,
        periodicidade: tipoData.periodicidade || "MENSAL",
        diasIntervalo: tipoData.diasIntervalo ? String(tipoData.diasIntervalo) : "",
        baseLegal: tipoData.baseLegal || "",
        checklist: Array.isArray(tipoData.checklist)
          ? tipoData.checklist.map((item) => ({
              pergunta: item.pergunta || "",
              tipo: item.tipo || "SIM_NAO",
              obrigatorio: item.obrigatorio ?? true,
            }))
          : [],
        ativo: tipoData.ativo ?? true,
      })
    }
  }, [tipoData])

  const adicionarItem = () => {
    setTipo((prev) => ({
      ...prev,
      checklist: [...prev.checklist, { pergunta: "", tipo: "SIM_NAO", obrigatorio: true }],
    }))
  }

  const removerItem = (index: number) => {
    setTipo((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index),
    }))
  }

  const atualizarItem = (index: number, campo: keyof ChecklistItem, valor: string | boolean) => {
    setTipo((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item, i) =>
        i === index ? { ...item, [campo]: valor } : item
      ),
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!tipo.nome) {
      toast.error("Nome é obrigatório")
      return
    }
    if (tipo.periodicidade === "OUTRA" && !tipo.diasIntervalo) {
      toast.error("Informe o intervalo em dias")
      return
    }
    if (tipo.checklist.some((item) => !item.pergunta.trim())) {
      toast.error("Toda pergunta do checklist precisa de texto")
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/ativos/tipos-vistoria/${id}` : "/api/ativos/tipos-vistoria"
      const method = isEditing ? "PUT" : "POST"

      const body: Record<string, unknown> = {
        nome: tipo.nome,
        areaId: tipo.areaId,
        periodicidade: tipo.periodicidade,
        diasIntervalo:
          tipo.periodicidade === "OUTRA" && tipo.diasIntervalo
            ? parseInt(tipo.diasIntervalo)
            : null,
        baseLegal: tipo.baseLegal || null,
        checklist: tipo.checklist,
        ativo: tipo.ativo,
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(isEditing ? "Tipo de vistoria atualizado!" : "Tipo de vistoria criado!")
        router.push("/ativos/tipos-vistoria")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao salvar tipo de vistoria")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (
    field: keyof TipoVistoria,
    value: string | boolean | ChecklistItem[] | number | null
  ) => {
    setTipo((prev) => ({ ...prev, [field]: value }))
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
        <Link href="/ativos/tipos-vistoria">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Tipo de Vistoria" : "Novo Tipo de Vistoria"}
            {info && <InfoButton content={info} />}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome" className="font-medium">
              Nome
            </Label>
            <Input
              id="nome"
              value={tipo.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Extintor de Incêndio (Mensal)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="areaId" className="font-medium">
              Área
            </Label>
            <select
              id="areaId"
              value={tipo.areaId ?? ""}
              onChange={(e) =>
                handleChange("areaId", e.target.value ? parseInt(e.target.value) : null)
              }
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
            >
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="periodicidade" className="font-medium">
              Periodicidade
            </Label>
            <select
              id="periodicidade"
              value={tipo.periodicidade}
              onChange={(e) => handleChange("periodicidade", e.target.value)}
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
            >
              {PERIODICIDADES.map((periodicidade) => (
                <option key={periodicidade} value={periodicidade}>
                  {periodicidade}
                </option>
              ))}
            </select>
          </div>

          {tipo.periodicidade === "OUTRA" && (
            <div className="space-y-2">
              <Label htmlFor="diasIntervalo" className="font-medium">
                Intervalo (dias)
              </Label>
              <Input
                id="diasIntervalo"
                type="number"
                min={1}
                value={tipo.diasIntervalo}
                onChange={(e) => handleChange("diasIntervalo", e.target.value)}
                placeholder="180"
                required
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="baseLegal" className="font-medium">
            Base Legal
          </Label>
          <Textarea
            id="baseLegal"
            value={tipo.baseLegal}
            onChange={(e) => handleChange("baseLegal", e.target.value)}
            placeholder="NR-23, NBR 12693, etc."
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Checklist</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={adicionarItem}
            >
              <PlusCircle size={14} />
              Adicionar item
            </Button>
          </div>

          {tipo.checklist.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhum item adicionado. O checklist define as perguntas da vistoria.
            </p>
          ) : (
            <div className="space-y-3">
              {tipo.checklist.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Input
                      value={item.pergunta}
                      onChange={(e) => atualizarItem(index, "pergunta", e.target.value)}
                      placeholder="Pergunta da vistoria"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-red-500 hover:text-red-600"
                      onClick={() => removerItem(index)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <select
                      value={item.tipo}
                      onChange={(e) =>
                        atualizarItem(index, "tipo", e.target.value as ChecklistItem["tipo"])
                      }
                      className="flex-1 p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    >
                      {TIPOS_CHECKLIST.map((tipoChecklist) => (
                        <option key={tipoChecklist} value={tipoChecklist}>
                          {tipoChecklist}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={item.obrigatorio}
                        onChange={(e) => atualizarItem(index, "obrigatorio", e.target.checked)}
                        className="w-4 h-4"
                      />
                      Obrigatório
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ativo"
            checked={tipo.ativo}
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
          <Link href="/ativos/tipos-vistoria">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
