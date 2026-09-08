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

type Site = {
  id: number | null
  empresaId: string
  nome: string
  sigla: string
  cep: string
  endereco: string
  cidade: string
  uf: string
  ativo: boolean
}

interface Empresa {
  id: number
  nome: string
}

export default function ProcessoSiteFormPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [site, setSite] = useState<Site>({
    id: null,
    empresaId: "",
    nome: "",
    sigla: "",
    cep: "",
    endereco: "",
    cidade: "",
    uf: "",
    ativo: true,
  })
  const [saving, setSaving] = useState(false)

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ["proc-empresas"],
    queryFn: async () => {
      const res = await fetch("/api/processos/empresas")
      if (!res.ok) throw new Error("Falha ao carregar empresas")
      return res.json()
    },
  })

  const { data: siteData, isLoading: loading } = useQuery<Site>({
    queryKey: ["proc-site", id],
    queryFn: async () => {
      const res = await fetch(`/api/processos/sites/${id}`)
      return res.json()
    },
    enabled: !!isEditing && !!id,
  })

  useEffect(() => {
    if (siteData) {
      setSite({
        id: siteData.id,
        empresaId: siteData.empresaId ? String(siteData.empresaId) : "",
        nome: siteData.nome || "",
        sigla: siteData.sigla || "",
        cep: siteData.cep || "",
        endereco: siteData.endereco || "",
        cidade: siteData.cidade || "",
        uf: siteData.uf || "",
        ativo: siteData.ativo ?? true,
      })
    }
  }, [siteData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!site.nome) {
      toast.error("Nome é obrigatório")
      return
    }
    if (!site.empresaId) {
      toast.error("Selecione a empresa")
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/processos/sites/${id}` : "/api/processos/sites"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...site,
          empresaId: parseInt(site.empresaId),
        }),
      })

      if (res.ok) {
        toast.success(isEditing ? "Site atualizado!" : "Site criado!")
        router.push("/processos/sites")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao salvar site")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Site, value: string | boolean) => {
    setSite(prev => ({ ...prev, [field]: value }))
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
        <Link href="/processos/sites">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Site" : "Novo Site"}
            {info && <InfoButton content={info} />}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="empresaId">Empresa *</Label>
          <select
            id="empresaId"
            value={site.empresaId}
            onChange={e => handleChange("empresaId", e.target.value)}
            className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
          >
            <option value="">Selecione a empresa</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={site.nome}
              onChange={e => handleChange("nome", e.target.value)}
              placeholder="Unidade PDM Têxtil"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sigla">Sigla</Label>
            <Input
              id="sigla"
              value={site.sigla || ""}
              onChange={e => handleChange("sigla", e.target.value)}
              placeholder="PDM"
              maxLength={10}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              value={site.cep || ""}
              onChange={e => handleChange("cep", e.target.value)}
              placeholder="00000-000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={site.endereco || ""}
              onChange={e => handleChange("endereco", e.target.value)}
              placeholder="Rua, número, bairro"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={site.cidade || ""}
              onChange={e => handleChange("cidade", e.target.value)}
              placeholder="São Paulo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uf">UF</Label>
            <Input
              id="uf"
              value={site.uf || ""}
              onChange={e => handleChange("uf", e.target.value)}
              placeholder="SP"
              maxLength={2}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" checked={site.ativo} onChange={e => handleChange("ativo", e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="ativo">Ativo</Label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
          <Link href="/processos/sites">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}