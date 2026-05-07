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

const baseSchema = z.object({
  codigoBase: z.string().min(1, "Código é obrigatório"),
  codigoCompleto: z.string().min(1, "Código completo é obrigatório"),
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().nullable(),
  densidade: z.string().nullable(),
  tratamentoEncolagem: z.string().nullable(),
  tensaoUrdume: z.string().nullable(),
  largura: z.string().nullable(),
  observacoes: z.string().nullable(),
  ativo: z.coerce.boolean(),
})

type BaseFormData = z.infer<typeof baseSchema>

export default function BaseUrdumeFormPage() {
  const router = useRouter()
  const params = useParams()
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<BaseFormData>({
    resolver: zodResolver(baseSchema),
    defaultValues: { 
      ativo: true, 
      codigoBase: "", 
      codigoCompleto: "", 
      nome: "", 
      descricao: null, 
      densidade: null, 
      tratamentoEncolagem: null, 
      tensaoUrdume: null, 
      largura: null, 
      observacoes: null 
    },
  })

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditing)

  useEffect(() => {
    if (isEditing && id) {
      fetch(`/api/cadastros/bases-urdume/${id}`)
        .then(res => res.json())
        .then(data => {
          setValue("codigoBase", data.codigoBase)
          setValue("codigoCompleto", data.codigoCompleto)
          setValue("nome", data.nome)
          setValue("descricao", data.descricao || "")
          setValue("densidade", data.densidade || "")
          setValue("tratamentoEncolagem", data.tratamentoEncolagem || "")
          setValue("tensaoUrdume", data.tensaoUrdume || "")
          setValue("largura", data.largura || "")
          setValue("observacoes", data.observacoes || "")
          setValue("ativo", data.ativo ?? true)
        })
        .catch(() => toast.error("Erro ao carregar dados"))
        .finally(() => setInitialLoading(false))
    }
  }, [id, isEditing, setValue])

  const onSubmit = async (data: BaseFormData) => {
    setLoading(true)
    try {
      const url = isEditing ? `/api/cadastros/bases-urdume/${id}` : "/api/cadastros/bases-urdume"
      const method = isEditing ? "PUT" : "POST"

      const payload = {
        ...data,
        descricao: data.descricao || null,
        densidade: data.densidade || null,
        tratamentoEncolagem: data.tratamentoEncolagem || null,
        tensaoUrdume: data.tensaoUrdume || null,
        largura: data.largura || null,
        observacoes: data.observacoes || null,
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Erro ao salvar")

      toast.success(isEditing ? "Base atualizada!" : "Base criada!")
      router.push("/cadastros/bases-urdume")
    } catch {
      toast.error("Erro ao salvar base")
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codigoBase">Código Curto *</Label>
            <Input {...register("codigoBase")} placeholder="UR001" />
            {errors.codigoBase && <p className="text-sm text-red-500">{errors.codigoBase.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigoCompleto">Código Completo *</Label>
            <Input {...register("codigoCompleto")} placeholder="4.UR001.CRU.000001" />
            {errors.codigoCompleto && <p className="text-sm text-red-500">{errors.codigoCompleto.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input {...register("nome")} placeholder="Base de Urdume 001" />
          {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Input {...register("descricao")} placeholder="Descrição da base" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="densidade">Densidade (fios/cm)</Label>
            <Input {...register("densidade")} placeholder="30" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="largura">Largura (m)</Label>
            <Input {...register("largura")} placeholder="2.50" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tratamentoEncolagem">Tratamento de Encolagem</Label>
            <Input {...register("tratamentoEncolagem")} placeholder="Mercerização" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tensaoUrdume">Tensão (kg)</Label>
            <Input {...register("tensaoUrdume")} placeholder="25" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Input {...register("observacoes")} placeholder="Observações adicionais" />
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
          <Link href="/cadastros/bases-urdume">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}