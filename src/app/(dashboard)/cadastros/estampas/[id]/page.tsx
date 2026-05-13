"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type Estampa = {
  id: number
  codigoDesenho: string
  variante: string
  nome: string
  tipo?: string | null
  imagemUrl?: string | null
  ativo: boolean
  idIntegracao?: string | null
}

export default function EstampaFormPage() {
  const router = useRouter()
  const params = useParams()
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [estampa, setEstampa] = useState<Estampa>({
    id: 0,
    codigoDesenho: "",
    variante: "01",
    nome: "",
    tipo: "",
    imagemUrl: "",
    ativo: true,
    idIntegracao: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEditing && id) {
      fetch(`/api/cadastros/estampas/${id}`)
        .then(res => res.json())
        .then(data => {
          setEstampa({
            id: data.id,
            codigoDesenho: data.codigoDesenho || "",
            variante: data.variante || "01",
            nome: data.nome || "",
            tipo: data.tipo || "",
            imagemUrl: data.imagemUrl || "",
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
    if (!estampa.codigoDesenho || !estampa.nome) {
      toast.error("Código do Desenho e Nome são obrigatórios")
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/cadastros/estampas/${id}` : "/api/cadastros/estampas"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(estampa),
      })

      if (res.ok) {
        toast.success(isEditing ? "Estampa atualizada!" : "Estampa criada!")
        router.push("/cadastros/estampas")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erro ao salvar estampa")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Estampa, value: string | boolean) => {
    setEstampa(prev => ({ ...prev, [field]: value }))
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
        <Link href="/cadastros/estampas">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Estampa" : "Nova Estampa"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codigoDesenho">Código do Desenho (4 dígitos) *</Label>
            <Input
              id="codigoDesenho"
              value={estampa.codigoDesenho}
              onChange={e => handleChange("codigoDesenho", e.target.value)}
              placeholder="5001"
              maxLength={4}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="variante">Variante</Label>
            <Input
              id="variante"
              value={estampa.variante}
              onChange={e => handleChange("variante", e.target.value)}
              placeholder="01"
              maxLength={2}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            value={estampa.nome}
            onChange={e => handleChange("nome", e.target.value)}
            placeholder="Floral Botânico"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo</Label>
          <Input
            id="tipo"
            value={estampa.tipo || ""}
            onChange={e => handleChange("tipo", e.target.value)}
            placeholder="FLORAL"
            list="tipos"
          />
          <datalist id="tipos">
            <option value="FLORAL" />
            <option value="LISTRADO" />
            <option value="POA" />
            <option value="GEOMETRICO" />
            <option value="ABSTRATO" />
            <option value="ANIMAL" />
          </datalist>
        </div>

        <div className="space-y-2">
          <Label htmlFor="imagemUrl">URL da Imagem</Label>
          <Input
            id="imagemUrl"
            value={estampa.imagemUrl || ""}
            onChange={e => handleChange("imagemUrl", e.target.value)}
            placeholder="https://..."
          />
        </div>

<div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" checked={estampa.ativo} onChange={e => handleChange("ativo", e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="ativo">Ativo</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="idIntegracao">ID Integração (ERP/WMS/CRM/OUTROS)</Label>
          <Input id="idIntegracao" value={estampa.idIntegracao || ""} onChange={e => handleChange("idIntegracao", e.target.value)} placeholder="Código do sistema externo" />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
          <Link href="/cadastros/estampas">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}