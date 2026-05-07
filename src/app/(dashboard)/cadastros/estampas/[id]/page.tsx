"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const estampaSchema = z.object({
  codigoDesenho: z.string().min(1, "Código do desenho é obrigatório").max(4, "Máximo 4 dígitos"),
  variante: z.string().max(2, "Máximo 2 dígitos").default("01"),
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.string().nullable(),
  imagemUrl: z.string().nullable(),
  ativo: z.coerce.boolean(),
})

type EstampaFormData = z.infer<typeof estampaSchema>

const TIPOS = ["FLORAL", "LISTRADO", "POA", "GEOMETRICO", "ABSTRATO", "ANIMAL", "INFANTIL"]

export default function EstampaFormPage() {
  const router = useRouter()
  const params = useParams()
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<EstampaFormData>({
    resolver: zodResolver(estampaSchema),
    defaultValues: { ativo: true, variante: "01", codigoDesenho: "", nome: "", tipo: null, imagemUrl: null },
  })

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditing)

  useEffect(() => {
    if (isEditing && id) {
      fetch(`/api/cadastros/estampas/${id}`)
        .then(res => res.json())
        .then(data => {
          setValue("codigoDesenho", data.codigoDesenho)
          setValue("variante", data.variante || "01")
          setValue("nome", data.nome)
          setValue("tipo", data.tipo || "")
          setValue("imagemUrl", data.imagemUrl || "")
          setValue("ativo", data.ativo ?? true)
        })
        .catch(() => toast.error("Erro ao carregar dados"))
        .finally(() => setInitialLoading(false))
    }
  }, [id, isEditing, setValue])

  const onSubmit = async (data: EstampaFormData) => {
    setLoading(true)
    try {
      const url = isEditing ? `/api/cadastros/estampas/${id}` : "/api/cadastros/estampas"
      const method = isEditing ? "PUT" : "POST"

      const payload = {
        ...data,
        tipo: data.tipo || null,
        imagemUrl: data.imagemUrl || null,
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Erro ao salvar")

      toast.success(isEditing ? "Estampa atualizada!" : "Estampa criada!")
      router.push("/cadastros/estampas")
    } catch {
      toast.error("Erro ao salvar estampa")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codigoDesenho">Código do Desenho (4 dígitos) *</Label>
            <Input {...register("codigoDesenho")} placeholder="5001" maxLength={4} />
            {errors.codigoDesenho && <p className="text-sm text-red-500">{errors.codigoDesenho.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="variante">Variante</Label>
            <Input {...register("variante")} placeholder="01" maxLength={2} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input {...register("nome")} placeholder="Floral Botanico" />
          {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo</Label>
          <Input {...register("tipo")} list="tipos" placeholder="FLORAL" />
          <datalist id="tipos">
            {TIPOS.map(t => <option key={t} value={t} />)}
          </datalist>
        </div>

        <div className="space-y-2">
          <Label htmlFor="imagemUrl">URL da Imagem</Label>
          <Input {...register("imagemUrl")} placeholder="https://..." />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" {...register("ativo")} id="ativo" className="w-4 h-4" />
          <Label htmlFor="ativo">Ativo</Label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
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