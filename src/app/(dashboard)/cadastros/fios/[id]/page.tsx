"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const fioSchema = z.object({
  codigoFio: z.string().min(1, "Código curto é obrigatório"),
  nome: z.string().min(1, "Nome é obrigatório"),
  nomeComercial: z.string().optional(),
  composicao: z.string().optional(),
  titulo: z.string().optional(),
  torcao: z.string().optional(),
  resistencia: z.string().optional(),
  alongamento: z.string().optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean().default(true),
})

type FioFormData = z.infer<typeof fioSchema>

interface Fornecedor {
  id: number
  nome: string
  cnpj?: string
  ativo?: boolean
}

interface FioFornecedor {
  id: number
  fornecedorId: number
  codigoFornecedor: string
  observacoes: string
  fornecedorNome: string
  fornecedorCnpj: string
}

export default function NovoFioPage() {
  const params = useParams()
  const router = useRouter()
  const isEditing = params.id && params.id !== "novo"
  const [loading, setLoading] = useState(isEditing)
  
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [fioFornecedores, setFioFornecedores] = useState<FioFornecedor[]>([])
  const [showFornecedorForm, setShowFornecedorForm] = useState(false)
  const [selectedFornecedor, setSelectedFornecedor] = useState("")
  const [codigoFornecedor, setCodigoFornecedor] = useState("")

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FioFormData>({
    resolver: zodResolver(fioSchema),
    defaultValues: { ativo: true },
  })

  useEffect(() => {
    fetch("/api/cadastros/fornecedores")
      .then(res => res.json())
      .then(data => setFornecedores(data))
  }, [])

  useEffect(() => {
    if (isEditing && params.id) {
      Promise.all([
        fetch(`/api/cadastros/fios/${params.id}`).then(res => res.json()),
        fetch(`/api/cadastros/fios/${params.id}/fornecedores`).then(res => res.json())
      ]).then(([fioData, fornecedoresData]) => {
        Object.keys(fioData).forEach(key => {
          setValue(key as any, fioData[key])
        })
        setFioFornecedores(fornecedoresData)
        setLoading(false)
      })
    }
  }, [isEditing, params.id, setValue])

  const onSubmit = async (data: FioFormData) => {
    try {
      const url = isEditing 
        ? `/api/cadastros/fios/${params.id}`
        : "/api/cadastros/fios"
      
      const method = isEditing ? "PUT" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          codigoCompleto: `7.${data.codigoFio}.XXX.000001`,
        }),
      })

      if (!res.ok) throw new Error("Erro ao salvar")

      toast.success(isEditing ? "Fio atualizado" : "Fio criado")
      router.push("/cadastros/fios")
    } catch {
      toast.error("Erro ao salvar fio")
    }
  }

  const addFornecedor = async () => {
    if (!selectedFornecedor || !isEditing || !params.id) {
      toast.error("Salve o fio primeiro para adicionar fornecedores")
      return
    }
    
    try {
      const res = await fetch(`/api/cadastros/fios/${params.id}/fornecedores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fornecedorId: parseInt(selectedFornecedor),
          codigoFornecedor,
        }),
      })
      
      if (!res.ok) throw new Error()
      
      const novos = await fetch(`/api/cadastros/fios/${params.id}/fornecedores`).then(r => r.json())
      setFioFornecedores(novos)
      setSelectedFornecedor("")
      setCodigoFornecedor("")
      setShowFornecedorForm(false)
      toast.success("Fornecedor adicionado")
    } catch {
      toast.error("Erro ao adicionar fornecedor")
    }
  }

  const removeFornecedor = async (id: number) => {
    if (!isEditing || !params.id) return
    
    try {
      await fetch(`/api/cadastros/fios/${params.id}/fornecedores/${id}`, { method: "DELETE" })
      setFioFornecedores(fioFornecedores.filter(f => f.id !== id))
      toast.success("Fornecedor removido")
    } catch {
      toast.error("Erro ao remover fornecedor")
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
          href="/cadastros/fios" 
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Fio" : "Novo Fio"}
          </h1>
          <p className="text-sm text-slate-500">
            {isEditing ? "Altere os dados do fio" : "Cadastre um novo fio no sistema"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="codigoFio">Código Curto *</Label>
              <Input id="codigoFio" placeholder="Ex: AL20, CO30" {...register("codigoFio")} />
              {errors.codigoFio && <p className="text-xs text-red-500">{errors.codigoFio.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" placeholder="Ex: Algodão Brasileiro" {...register("nome")} />
              {errors.nome && <p className="text-xs text-red-500">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeComercial">Nome Comercial</Label>
              <Input id="nomeComercial" {...register("nomeComercial")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" placeholder="Ex: 20/1, 30/1" {...register("titulo")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="composicao">Composição</Label>
              <Input id="composicao" placeholder="Ex: 100% Algodão" {...register("composicao")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="torcao">Torção</Label>
              <Input id="torcao" placeholder="Ex: Z, S" {...register("torcao")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resistencia">Resistência (kgf)</Label>
              <Input id="resistencia" placeholder="Ex: 350.00" {...register("resistencia")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alongamento">Alongamento (%)</Label>
              <Input id="alongamento" placeholder="Ex: 5.50" {...register("alongamento")} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <textarea
                id="observacoes"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                {...register("observacoes")}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="ativo" className="rounded" {...register("ativo")} />
            <Label htmlFor="ativo">Fio ativo</Label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Link href="/cadastros/fios">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </div>

      {/* Seção de Fornecedores */}
      {isEditing && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Fornecedores</h2>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={() => setShowFornecedorForm(!showFornecedorForm)}
            >
              <Plus size={14} />
              Adicionar Fornecedor
            </Button>
          </div>

          {showFornecedorForm && (
            <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <select 
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={selectedFornecedor}
                    onChange={(e) => setSelectedFornecedor(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {fornecedores.filter(f => f.ativo).map(f => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Código do Fornecedor</Label>
                  <Input 
                    placeholder="Código do fornecedor"
                    value={codigoFornecedor}
                    onChange={(e) => setCodigoFornecedor(e.target.value)}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="button" onClick={addFornecedor}>Adicionar</Button>
                  <Button type="button" variant="outline" onClick={() => setShowFornecedorForm(false)}>Cancelar</Button>
                </div>
              </div>
            </div>
          )}

          {fioFornecedores.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum fornecedor vinculado</p>
          ) : (
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 p-2">Fornecedor</th>
                  <th className="text-left text-xs font-medium text-slate-500 p-2">CNPJ</th>
                  <th className="text-left text-xs font-medium text-slate-500 p-2">Código</th>
                  <th className="text-right text-xs font-medium text-slate-500 p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {fioFornecedores.map((ff) => (
                  <tr key={ff.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-2 text-sm">{ff.fornecedorNome}</td>
                    <td className="p-2 text-sm text-slate-500">{ff.fornecedorCnpj || "—"}</td>
                    <td className="p-2 text-sm">{ff.codigoFornecedor || "—"}</td>
                    <td className="p-2 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-red-500"
                        onClick={() => removeFornecedor(ff.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}