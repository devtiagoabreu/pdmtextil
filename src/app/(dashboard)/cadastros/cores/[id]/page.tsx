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

const corSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório").max(6, "Máximo 6 dígitos"),
  nome: z.string().min(1, "Nome é obrigatório"),
  pantone: z.string().optional().or(z.literal("")),
  familia: z.string().optional().or(z.literal("")),
  ativo: z.boolean(),
})

type CorFormData = z.infer<typeof corSchema>

const FAMILIAS = ["AZUL", "VERMELHO", "VERDE", "AMARELO", "LARANJA", "ROXO", "Rosa", "PRETO", "BRANCO", "BEGE", "MARROM"]

export default function CorSolidaFormPage() {
  const router = useRouter()
  const params = useParams()
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<CorFormData>({
    resolver: zodResolver(corSchema),
    defaultValues: { ativo: true, codigo: "", nome: "", pantone: "", familia: "" },
  })

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditing)

  useEffect(() => {
    if (isEditing && id) {
      fetch(`/api/cadastros/cores/${id}`)
        .then(res => res.json())
        .then(data => {
          setValue("codigo", data.codigo)
          setValue("nome", data.nome)
          setValue("pantone", data.pantone || "")
          setValue("familia", data.familia || "")
          setValue("ativo", data.ativo ?? true)
        })
        .catch(() => toast.error("Erro ao carregar dados"))
        .finally(() => setInitialLoading(false))
    }
  }, [id, isEditing, setValue])

  const onSubmit = async (data: CorFormData) => {
    setLoading(true)
    try {
      const url = isEditing ? `/api/cadastros/cores/${id}` : "/api/cadastros/cores"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error("Erro ao salvar")

      toast.success(isEditing ? "Cor atualizada!" : "Cor criada!")
      router.push("/cadastros/cores")
    } catch {
      toast.error("Erro ao salvar cor")
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código (6 dígitos) *</Label>
            <Input {...register("codigo")} placeholder="0001A1" maxLength={6} />
            {errors.codigo && <p className="text-sm text-red-500">{errors.codigo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input {...register("nome")} placeholder="Azul Marinho" />
            {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pantone">Referência Pantone</Label>
            <Input {...register("pantone")} placeholder="2955C" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="familia">Família</Label>
            <Input {...register("familia")} list="familias" placeholder="AZUL" />
            <datalist id="familias">
              {FAMILIAS.map(f => <option key={f} value={f} />)}
            </datalist>
          </div>
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
          <Link href="/cadastros/cores">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}