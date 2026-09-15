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

const SETORES = ["SEGURANCA", "MECANICA", "ELETRICA", "AMBIENTAL", "PREDIAL", "LOGISTICA", "ADMINISTRATIVO"] as const

type CategoriaAtivo = {
  id: number | null
  nome: string
  setor: string
  descricao: string
  cor: string
  icone: string
  ativo: boolean
}

export default function AtivoCategoriaFormPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [categoria, setCategoria] = useState<CategoriaAtivo>({
    id: null,
    nome: "",
    setor: "SEGURANCA",
    descricao: "",
    cor: "#ef4444",
    icone: "",
    ativo: true,
  })
  const [saving, setSaving] = useState(false)

  const { data: categoriaData, isLoading: loading } = useQuery<CategoriaAtivo>({
    queryKey: ["ativos-categoria", id],
    queryFn: async () => {
      const res = await fetch(`/api/ativos/categorias/${id}`)
      return res.json()
    },
    enabled: !!isEditing && !!id,
  })

  useEffect(() => {
    if (categoriaData) {
      setCategoria({
        id: categoriaData.id,
        nome: categoriaData.nome || "",
        setor: categoriaData.setor || "SEGURANCA",
        descricao: categoriaData.descricao || "",
        cor: categoriaData.cor || "#ef4444",
        icone: categoriaData.icone || "",
        ativo: categoriaData.ativo ?? true,
      })
    }
  }, [categoriaData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!categoria.nome) {
      toast.error("Nome é obrigatório")
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/ativos/categorias/${id}` : "/api/ativos/categorias"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: categoria.nome,
          setor: categoria.setor,
          descricao: categoria.descricao || null,
          cor: categoria.cor || null,
          icone: categoria.icone || null,
          ativo: categoria.ativo,
        }),
      })

      if (res.ok) {
        toast.success(isEditing ? "Categoria atualizada!" : "Categoria criada!")
        router.push("/ativos/categorias")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao salvar categoria")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof CategoriaAtivo, value: string | boolean) => {
    setCategoria(prev => ({ ...prev, [field]: value }))
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
        <Link href="/ativos/categorias">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Categoria" : "Nova Categoria"}
            {info && <InfoButton content={info} />}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="nome" className="font-medium">Nome</Label>
          <Input
            id="nome"
            value={categoria.nome}
            onChange={e => handleChange("nome", e.target.value)}
            placeholder="Segurança Contra Incêndio"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="setor" className="font-medium">Setor</Label>
          <select
            id="setor"
            value={categoria.setor}
            onChange={e => handleChange("setor", e.target.value)}
            className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
          >
            {SETORES.map((setor) => (
              <option key={setor} value={setor}>{setor}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao" className="font-medium">Descrição</Label>
          <Textarea
            id="descricao"
            value={categoria.descricao || ""}
            onChange={e => handleChange("descricao", e.target.value)}
            placeholder="Descrição da categoria"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cor" className="font-medium">Cor</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="cor"
              value={categoria.cor}
              onChange={e => handleChange("cor", e.target.value)}
              className="h-9 w-14 cursor-pointer rounded border border-slate-300 dark:border-slate-600"
            />
            <Input
              value={categoria.cor}
              onChange={e => handleChange("cor", e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" checked={categoria.ativo} onChange={e => handleChange("ativo", e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="ativo">Ativo</Label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
          <Link href="/ativos/categorias">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}