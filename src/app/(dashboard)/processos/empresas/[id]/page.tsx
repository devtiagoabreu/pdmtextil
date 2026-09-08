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

type Empresa = {
  id: number | null
  nome: string
  cnpj: string
  segmento: string
  observacoes: string
  ativo: boolean
}

export default function ProcessoEmpresaFormPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [empresa, setEmpresa] = useState<Empresa>({
    id: null,
    nome: "",
    cnpj: "",
    segmento: "",
    observacoes: "",
    ativo: true,
  })
  const [saving, setSaving] = useState(false)

  const { data: empresaData, isLoading: loading } = useQuery<Empresa>({
    queryKey: ["proc-empresa", id],
    queryFn: async () => {
      const res = await fetch(`/api/processos/empresas/${id}`)
      return res.json()
    },
    enabled: !!isEditing && !!id,
  })

  useEffect(() => {
    if (empresaData) {
      setEmpresa({
        id: empresaData.id,
        nome: empresaData.nome || "",
        cnpj: empresaData.cnpj || "",
        segmento: empresaData.segmento || "",
        observacoes: empresaData.observacoes || "",
        ativo: empresaData.ativo ?? true,
      })
    }
  }, [empresaData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!empresa.nome) {
      toast.error("Nome é obrigatório")
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/processos/empresas/${id}` : "/api/processos/empresas"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empresa),
      })

      if (res.ok) {
        toast.success(isEditing ? "Empresa atualizada!" : "Empresa criada!")
        router.push("/processos/empresas")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao salvar empresa")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Empresa, value: string | boolean) => {
    setEmpresa(prev => ({ ...prev, [field]: value }))
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
        <Link href="/processos/empresas">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Empresa" : "Nova Empresa"}
            {info && <InfoButton content={info} />}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={empresa.nome}
              onChange={e => handleChange("nome", e.target.value)}
              placeholder="PDM Têxtil"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={empresa.cnpj || ""}
              onChange={e => handleChange("cnpj", e.target.value)}
              placeholder="00.000.000/0001-00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="segmento">Segmento</Label>
          <Input
            id="segmento"
            value={empresa.segmento || ""}
            onChange={e => handleChange("segmento", e.target.value)}
            placeholder="Têxtil, Confecção..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Input
            id="observacoes"
            value={empresa.observacoes || ""}
            onChange={e => handleChange("observacoes", e.target.value)}
            placeholder="Observações gerais"
          />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" checked={empresa.ativo} onChange={e => handleChange("ativo", e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="ativo">Ativo</Label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
          <Link href="/processos/empresas">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}