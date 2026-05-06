"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const fornecedorSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().optional(),
  razaoSocial: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  contato: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  ativo: z.boolean().default(true),
})

type FornecedorFormData = z.infer<typeof fornecedorSchema>

export default function NovoFornecedorPage() {
  const params = useParams()
  const router = useRouter()
  const isEditing = params.id && params.id !== "novo"
  const [loading, setLoading] = useState(isEditing)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: { ativo: true },
  })

  useEffect(() => {
    if (isEditing && params.id) {
      fetch(`/api/cadastros/fornecedores/${params.id}`)
        .then(res => res.json())
        .then(data => {
          Object.keys(data).forEach(key => {
            setValue(key as any, data[key])
          })
        })
        .finally(() => setLoading(false))
    }
  }, [isEditing, params.id, setValue])

  const onSubmit = async (data: FornecedorFormData) => {
    try {
      const url = isEditing 
        ? `/api/cadastros/fornecedores/${params.id}`
        : "/api/cadastros/fornecedores"
      
      const method = isEditing ? "PUT" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error("Erro ao salvar")

      toast.success(isEditing ? "Fornecedor atualizado" : "Fornecedor criado")
      router.push("/cadastros/fornecedores")
    } catch {
      toast.error("Erro ao salvar fornecedor")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link 
          href="/cadastros/fornecedores" 
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Fornecedor" : "Novo Fornecedor"}
          </h1>
          <p className="text-sm text-slate-500">
            {isEditing ? "Altere os dados do fornecedor" : "Cadastre um novo fornecedor"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" placeholder="Nome do fornecedor" {...register("nome")} />
              {errors.nome && <p className="text-xs text-red-500">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" placeholder="00.000.000/0001-00" {...register("cnpj")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="razaoSocial">Razão Social</Label>
              <Input id="razaoSocial" placeholder="Razão social completa" {...register("razaoSocial")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="contato@fornecedor.com" {...register("email")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" placeholder="(11) 99999-9999" {...register("telefone")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contato">Pessoa de Contato</Label>
              <Input id="contato" placeholder="Nome do contato" {...register("contato")} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" placeholder="Endereço completo" {...register("endereco")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" placeholder="Cidade" {...register("cidade")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Input id="uf" placeholder="SP" maxLength={2} {...register("uf")} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="ativo" className="rounded" {...register("ativo")} />
            <Label htmlFor="ativo">Fornecedor ativo</Label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Link href="/cadastros/fornecedores">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}