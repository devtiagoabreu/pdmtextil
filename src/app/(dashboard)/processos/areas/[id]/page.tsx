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

type Area = {
  id: number | null
  siteId: string
  nome: string
  descricao: string
  ativo: boolean
}

interface Site {
  id: number
  nome: string
}

export default function ProcessoAreaFormPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [area, setArea] = useState<Area>({
    id: null,
    siteId: "",
    nome: "",
    descricao: "",
    ativo: true,
  })
  const [saving, setSaving] = useState(false)

  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ["proc-sites"],
    queryFn: async () => {
      const res = await fetch("/api/processos/sites")
      if (!res.ok) throw new Error("Falha ao carregar sites")
      return res.json()
    },
  })

  const { data: areaData, isLoading: loading } = useQuery<Area>({
    queryKey: ["proc-area", id],
    queryFn: async () => {
      const res = await fetch(`/api/processos/areas/${id}`)
      return res.json()
    },
    enabled: !!isEditing && !!id,
  })

  useEffect(() => {
    if (areaData) {
      setArea({
        id: areaData.id,
        siteId: areaData.siteId ? String(areaData.siteId) : "",
        nome: areaData.nome || "",
        descricao: areaData.descricao || "",
        ativo: areaData.ativo ?? true,
      })
    }
  }, [areaData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!area.nome) {
      toast.error("Nome é obrigatório")
      return
    }
    if (!area.siteId) {
      toast.error("Selecione o site")
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/processos/areas/${id}` : "/api/processos/areas"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...area,
          siteId: parseInt(area.siteId),
        }),
      })

      if (res.ok) {
        toast.success(isEditing ? "Área atualizada!" : "Área criada!")
        router.push("/processos/areas")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao salvar área")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Area, value: string | boolean) => {
    setArea(prev => ({ ...prev, [field]: value }))
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
        <Link href="/processos/areas">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Área" : "Nova Área"}
            {info && <InfoButton content={info} />}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="siteId">Site *</Label>
          <select
            id="siteId"
            value={area.siteId}
            onChange={e => handleChange("siteId", e.target.value)}
            className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
          >
            <option value="">Selecione o site</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>{site.nome}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            value={area.nome}
            onChange={e => handleChange("nome", e.target.value)}
            placeholder="Produção / Tecelagem"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Input
            id="descricao"
            value={area.descricao || ""}
            onChange={e => handleChange("descricao", e.target.value)}
            placeholder="Descrição da área"
          />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" checked={area.ativo} onChange={e => handleChange("ativo", e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="ativo">Ativo</Label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
          <Link href="/processos/areas">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}