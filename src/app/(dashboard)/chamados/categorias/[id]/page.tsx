"use client"

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter, useParams, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { CHAMADO_CATEGORIA_CORES_OPCOES } from "@/hooks/use-chamado-categorias"

type ChamadoCategoria = {
  id: number | null
  codigo: string
  nome: string
  cor: string
  ativo: boolean
  ordem: number
}

const selectClass =
  "w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"

export default function ChamadoCategoriaFormPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const queryClient = useQueryClient()
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [categoria, setCategoria] = useState<ChamadoCategoria>({
    id: null,
    codigo: "",
    nome: "",
    cor: "slate",
    ativo: true,
    ordem: 0,
  })
  const [saving, setSaving] = useState(false)

  const { data: categoriaData, isLoading: loading } = useQuery<ChamadoCategoria>({
    queryKey: ["chamado-categoria", id],
    queryFn: async () => {
      const res = await fetch(`/api/chamados/categorias/${id}`)
      return res.json()
    },
    enabled: !!isEditing && !!id,
  })

  useEffect(() => {
    if (categoriaData) {
      setCategoria({
        id: categoriaData.id,
        codigo: categoriaData.codigo || "",
        nome: categoriaData.nome || "",
        cor: categoriaData.cor || "slate",
        ativo: categoriaData.ativo ?? true,
        ordem: categoriaData.ordem ?? 0,
      })
    }
  }, [categoriaData])

  const handleChange = <K extends keyof ChamadoCategoria>(field: K, value: ChamadoCategoria[K]) => {
    setCategoria((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!categoria.codigo.trim()) {
      toast.error("Informe o código")
      return
    }
    if (!categoria.nome.trim()) {
      toast.error("Informe o nome")
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/chamados/categorias/${id}` : "/api/chamados/categorias"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: categoria.codigo,
          nome: categoria.nome,
          cor: categoria.cor,
          ativo: categoria.ativo,
          ordem: categoria.ordem,
        }),
      })

      if (res.ok) {
        toast.success(isEditing ? "Categoria atualizada!" : "Categoria criada!")
        queryClient.invalidateQueries({ queryKey: ["chamados-categorias"] })
        router.push("/chamados/categorias")
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
        <Link href="/chamados/categorias">
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="codigo" className="font-medium">
              Código
            </Label>
            <Input
              id="codigo"
              value={categoria.codigo}
              onChange={(e) => handleChange("codigo", e.target.value.toUpperCase())}
              placeholder="INCIDENTE"
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Identificador gravado no chamado. Renomear atualiza os chamados existentes.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome" className="font-medium">
              Nome
            </Label>
            <Input
              id="nome"
              value={categoria.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Incidente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cor" className="font-medium">
              Cor
            </Label>
            <select
              id="cor"
              value={categoria.cor}
              onChange={(e) => handleChange("cor", e.target.value)}
              className={selectClass}
            >
              {CHAMADO_CATEGORIA_CORES_OPCOES.map((cor) => (
                <option key={cor} value={cor}>
                  {cor}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ordem" className="font-medium">
              Ordem
            </Label>
            <Input
              id="ordem"
              type="number"
              min={0}
              max={999}
              value={categoria.ordem}
              onChange={(e) => handleChange("ordem", parseInt(e.target.value || "0", 10))}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ativo"
            checked={categoria.ativo}
            onChange={(e) => handleChange("ativo", e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="ativo">Ativa</Label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
          <Link href="/chamados/categorias">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
