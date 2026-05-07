"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type BaseUrdume = {
  id: number
  codigoBase: string
  codigoCompleto: string
  nome: string
  descricao?: string | null
  densidade?: string | null
  tratamentoEncolagem?: string | null
  tensaoUrdume?: string | null
  largura?: string | null
  observacoes?: string | null
  ativo: boolean
}

export default function BaseFormPage() {
  const router = useRouter()
  const params = useParams()
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [base, setBase] = useState<BaseUrdume>({
    id: 0,
    codigoBase: "",
    codigoCompleto: "",
    nome: "",
    descricao: "",
    densidade: "",
    tratamentoEncolagem: "",
    tensaoUrdume: "",
    largura: "",
    observacoes: "",
    ativo: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEditing && id) {
      fetch(`/api/cadastros/bases-urdume/${id}`)
        .then(res => res.json())
        .then(data => {
          setBase({
            id: data.id,
            codigoBase: data.codigoBase || "",
            codigoCompleto: data.codigoCompleto || "",
            nome: data.nome || "",
            descricao: data.descricao || "",
            densidade: data.densidade || "",
            tratamentoEncolagem: data.tratamentoEncolagem || "",
            tensaoUrdume: data.tensaoUrdume || "",
            largura: data.largura || "",
            observacoes: data.observacoes || "",
            ativo: data.ativo ?? true,
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
    if (!base.codigoBase || !base.codigoCompleto || !base.nome) {
      toast.error("Código, Código Completo e Nome são obrigatórios")
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/cadastros/bases-urdume/${id}` : "/api/cadastros/bases-urdume"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(base),
      })

      if (res.ok) {
        toast.success(isEditing ? "Base atualizada!" : "Base criada!")
        router.push("/cadastros/bases-urdume")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erro ao salvar base")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof BaseUrdume, value: string | boolean) => {
    setBase(prev => ({ ...prev, [field]: value }))
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
        <Link href="/cadastros/bases-urdume">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Base de Urdume" : "Nova Base de Urdume"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codigoBase">Código Curto *</Label>
            <Input
              id="codigoBase"
              value={base.codigoBase}
              onChange={e => handleChange("codigoBase", e.target.value)}
              placeholder="UR001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigoCompleto">Código Completo *</Label>
            <Input
              id="codigoCompleto"
              value={base.codigoCompleto}
              onChange={e => handleChange("codigoCompleto", e.target.value)}
              placeholder="4.UR001.CRU.000001"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            value={base.nome}
            onChange={e => handleChange("nome", e.target.value)}
            placeholder="Base Algodão 30/1"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Input
            id="descricao"
            value={base.descricao || ""}
            onChange={e => handleChange("descricao", e.target.value)}
            placeholder="Descrição da base"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="densidade">Densidade (fios/cm)</Label>
            <Input
              id="densidade"
              value={base.densidade || ""}
              onChange={e => handleChange("densidade", e.target.value)}
              placeholder="30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="largura">Largura (m)</Label>
            <Input
              id="largura"
              value={base.largura || ""}
              onChange={e => handleChange("largura", e.target.value)}
              placeholder="2.50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tratamentoEncolagem">Tratamento de Encolagem</Label>
            <Input
              id="tratamentoEncolagem"
              value={base.tratamentoEncolagem || ""}
              onChange={e => handleChange("tratamentoEncolagem", e.target.value)}
              placeholder="Mercerização"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tensaoUrdume">Tensão (kg)</Label>
            <Input
              id="tensaoUrdume"
              value={base.tensaoUrdume || ""}
              onChange={e => handleChange("tensaoUrdume", e.target.value)}
              placeholder="25"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Input
            id="observacoes"
            value={base.observacoes || ""}
            onChange={e => handleChange("observacoes", e.target.value)}
            placeholder="Observações adicionais"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ativo"
            checked={base.ativo}
            onChange={e => handleChange("ativo", e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="ativo">Ativo</Label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
          <Link href="/cadastros/bases-urdume">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}