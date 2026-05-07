"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type Fornecedor = {
  id: number
  nome: string
  cnpj?: string | null
  razaoSocial?: string | null
  email?: string | null
  telefone?: string | null
  contato?: string | null
  endereco?: string | null
  cidade?: string | null
  uf?: string | null
  ativo: boolean
}

export default function FornecedorFormPage() {
  const params = useParams()
  const router = useRouter()
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [fornecedor, setFornecedor] = useState<Fornecedor>({
    id: 0,
    nome: "",
    cnpj: "",
    razaoSocial: "",
    email: "",
    telefone: "",
    contato: "",
    endereco: "",
    cidade: "",
    uf: "",
    ativo: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEditing && id) {
      fetch(`/api/cadastros/fornecedores/${id}`)
        .then(res => res.json())
        .then(data => {
          setFornecedor({
            id: data.id,
            nome: data.nome || "",
            cnpj: data.cnpj || "",
            razaoSocial: data.razaoSocial || "",
            email: data.email || "",
            telefone: data.telefone || "",
            contato: data.contato || "",
            endereco: data.endereco || "",
            cidade: data.cidade || "",
            uf: data.uf || "",
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
    if (!fornecedor.nome) {
      toast.error("Nome é obrigatório")
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/cadastros/fornecedores/${id}` : "/api/cadastros/fornecedores"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fornecedor),
      })

      if (res.ok) {
        toast.success(isEditing ? "Fornecedor atualizado!" : "Fornecedor criado!")
        router.push("/cadastros/fornecedores")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erro ao salvar fornecedor")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Fornecedor, value: string | boolean) => {
    setFornecedor(prev => ({ ...prev, [field]: value }))
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
        <Link href="/cadastros/fornecedores">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Fornecedor" : "Novo Fornecedor"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome / Fantasia *</Label>
            <Input
              id="nome"
              value={fornecedor.nome}
              onChange={e => handleChange("nome", e.target.value)}
              placeholder="Fornecedor XYZ"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={fornecedor.cnpj || ""}
              onChange={e => handleChange("cnpj", e.target.value)}
              placeholder="00.000.000/0001-00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="razaoSocial">Razão Social</Label>
          <Input
            id="razaoSocial"
            value={fornecedor.razaoSocial || ""}
            onChange={e => handleChange("razaoSocial", e.target.value)}
            placeholder="Razão social completa"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={fornecedor.email || ""}
              onChange={e => handleChange("email", e.target.value)}
              placeholder="contato@fornecedor.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={fornecedor.telefone || ""}
              onChange={e => handleChange("telefone", e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contato">Pessoa de Contato</Label>
          <Input
            id="contato"
            value={fornecedor.contato || ""}
            onChange={e => handleChange("contato", e.target.value)}
            placeholder="João Silva"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endereco">Endereço</Label>
          <Input
            id="endereco"
            value={fornecedor.endereco || ""}
            onChange={e => handleChange("endereco", e.target.value)}
            placeholder="Rua, número, bairro"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={fornecedor.cidade || ""}
              onChange={e => handleChange("cidade", e.target.value)}
              placeholder="São Paulo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uf">UF</Label>
            <Input
              id="uf"
              value={fornecedor.uf || ""}
              onChange={e => handleChange("uf", e.target.value)}
              placeholder="SP"
              maxLength={2}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ativo"
            checked={fornecedor.ativo}
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
          <Link href="/cadastros/fornecedores">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}