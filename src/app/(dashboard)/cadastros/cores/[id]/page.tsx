"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type Cor = {
  id: number
  codigo: string
  nome: string
  pantone?: string | null
  familia?: string | null
  ativo: boolean
  idIntegracao?: string | null
}

export default function CorFormPage() {
  const router = useRouter()
  const params = useParams()
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [cor, setCor] = useState<Cor>({
    id: 0,
    codigo: "",
    nome: "",
    pantone: "",
    familia: "",
    ativo: true,
    idIntegracao: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEditing && id) {
      fetch(`/api/cadastros/cores/${id}`)
        .then(res => res.json())
        .then(data => {
          setCor({
            id: data.id,
            codigo: data.codigo || "",
            nome: data.nome || "",
            pantone: data.pantone || "",
            familia: data.familia || "",
            ativo: data.ativo ?? true,
            idIntegracao: data.idIntegracao || "",
          })
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [id, isEditing])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!cor.codigo || !cor.nome) {
      toast.error("Código e Nome são obrigatórios")
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/cadastros/cores/${id}` : "/api/cadastros/cores"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cor),
      })

      if (res.ok) {
        toast.success(isEditing ? "Cor atualizada!" : "Cor criada!")
        router.push("/cadastros/cores")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erro ao salvar cor")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Cor, value: string | boolean) => {
    setCor(prev => ({ ...prev, [field]: value }))
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
        <Link href="/cadastros/cores">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Cor" : "Nova Cor Sólida"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código (6 dígitos) *</Label>
            <Input
              id="codigo"
              value={cor.codigo}
              onChange={e => handleChange("codigo", e.target.value)}
              placeholder="0001A1"
              maxLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={cor.nome}
              onChange={e => handleChange("nome", e.target.value)}
              placeholder="Azul Marinho"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pantone">Referência Pantone</Label>
            <Input
              id="pantone"
              value={cor.pantone || ""}
              onChange={e => handleChange("pantone", e.target.value)}
              placeholder="2955C"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="familia">Família</Label>
            <Input
              id="familia"
              value={cor.familia || ""}
              onChange={e => handleChange("familia", e.target.value)}
              placeholder="AZUL"
              list="familias"
            />
            <datalist id="familias">
              <option value="AZUL" />
              <option value="VERMELHO" />
              <option value="VERDE" />
              <option value="AMARELO" />
              <option value="LARANJA" />
              <option value="ROXO" />
              <option value="PRETO" />
              <option value="BRANCO" />
            </datalist>
          </div>
        </div>

<div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" checked={cor.ativo} onChange={e => handleChange("ativo", e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="ativo">Ativo</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="idIntegracao">ID Integração (ERP/WMS/CRM/OUTROS)</Label>
          <Input id="idIntegracao" value={cor.idIntegracao || ""} onChange={e => handleChange("idIntegracao", e.target.value)} placeholder="Código do sistema externo" />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
          <Link href="/cadastros/cores">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}