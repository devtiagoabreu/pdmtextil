"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type Fio = {
  id: number
  codigoFio: string
  codigoCompleto: string
  nome: string
  nomeComercial?: string | null
  composicao?: string | null
  titulo?: string | null
  torcao?: string | null
  resistencia?: string | null
  alongamento?: string | null
  observacoes?: string | null
  ativo: boolean
}

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

export default function FioFormPage() {
  const params = useParams()
  const router = useRouter()
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [fio, setFio] = useState<Fio>({
    id: 0,
    codigoFio: "",
    codigoCompleto: "",
    nome: "",
    nomeComercial: "",
    composicao: "",
    titulo: "",
    torcao: "",
    resistencia: "",
    alongamento: "",
    observacoes: "",
    ativo: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [fioFornecedores, setFioFornecedores] = useState<FioFornecedor[]>([])
  const [showFornecedorForm, setShowFornecedorForm] = useState(false)
  const [selectedFornecedor, setSelectedFornecedor] = useState("")
  const [codigoFornecedor, setCodigoFornecedor] = useState("")

  useEffect(() => {
    fetch("/api/cadastros/fornecedores")
      .then(res => res.json())
      .then(data => setFornecedores(data))
  }, [])

  useEffect(() => {
    if (isEditing && id) {
      Promise.all([
        fetch(`/api/cadastros/fios/${id}`).then(res => res.json()),
        fetch(`/api/cadastros/fios/${id}/fornecedores`).then(res => res.json())
      ]).then(([fioData, fornecedoresData]) => {
        setFio({
          id: fioData.id,
          codigoFio: fioData.codigoFio || "",
          codigoCompleto: fioData.codigoCompleto || "",
          nome: fioData.nome || "",
          nomeComercial: fioData.nomeComercial || "",
          composicao: fioData.composicao || "",
          titulo: fioData.titulo || "",
          torcao: fioData.torcao || "",
          resistencia: fioData.resistencia || "",
          alongamento: fioData.alongamento || "",
          observacoes: fioData.observacoes || "",
          ativo: fioData.ativo ?? true,
        })
        setFioFornecedores(fornecedoresData)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [id, isEditing])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!fio.codigoFio || !fio.nome) {
      toast.error("Código e Nome são obrigatórios")
      return
    }

    const payload = {
      ...fio,
      codigoCompleto: `7.${fio.codigoFio}.XXX.000001`,
    }
    
    console.log("📤 Enviando fio:", payload)

    setSaving(true)
    try {
      const url = isEditing ? `/api/cadastros/fios/${id}` : "/api/cadastros/fios"
      const method = isEditing ? "PUT" : "POST"

      console.log("📤 URL:", url, "Method:", method)

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("📥 Status:", res.status)
      
      if (!res.ok) {
        const err = await res.json()
        console.error("❌ Erro da API:", err)
        throw new Error(err.error || "Erro ao salvar")
      }
        toast.success(isEditing ? "Fio atualizado!" : "Fio criado!")
        const novoFio = await res.json()
        if (isEditing) {
          router.push("/cadastros/fios")
        } else {
          router.push(`/cadastros/fios/${novoFio.id}`)
        }
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erro ao salvar fio")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Fio, value: string | boolean) => {
    setFio(prev => ({ ...prev, [field]: value }))
  }

  const addFornecedor = async () => {
    if (!selectedFornecedor || !id) {
      toast.error("Salve o fio primeiro para adicionar fornecedores")
      return
    }
    
    try {
      const res = await fetch(`/api/cadastros/fios/${id}/fornecedores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fornecedorId: parseInt(selectedFornecedor),
          codigoFornecedor,
        }),
      })
      
      if (!res.ok) throw new Error()
      
      const novos = await fetch(`/api/cadastros/fios/${id}/fornecedores`).then(r => r.json())
      setFioFornecedores(novos)
      setSelectedFornecedor("")
      setCodigoFornecedor("")
      setShowFornecedorForm(false)
      toast.success("Fornecedor adicionado")
    } catch {
      toast.error("Erro ao adicionar fornecedor")
    }
  }

  const removeFornecedor = async (fid: number) => {
    if (!id) return
    
    try {
      await fetch(`/api/cadastros/fios/${id}/fornecedores/${fid}`, { method: "DELETE" })
      setFioFornecedores(fioFornecedores.filter(f => f.id !== fid))
      toast.success("Fornecedor removido")
    } catch {
      toast.error("Erro ao remover fornecedor")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/cadastros/fios" className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Fio" : "Novo Fio"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codigoFio">Código Curto *</Label>
            <Input
              id="codigoFio"
              value={fio.codigoFio}
              onChange={e => handleChange("codigoFio", e.target.value)}
              placeholder="AL20"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={fio.nome}
              onChange={e => handleChange("nome", e.target.value)}
              placeholder="Fio de Algodão"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nomeComercial">Nome Comercial</Label>
            <Input
              id="nomeComercial"
              value={fio.nomeComercial || ""}
              onChange={e => handleChange("nomeComercial", e.target.value)}
              placeholder="Nome comercial"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="composicao">Composição</Label>
            <Input
              id="composicao"
              value={fio.composicao || ""}
              onChange={e => handleChange("composicao", e.target.value)}
              placeholder="100% Algodão"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={fio.titulo || ""}
              onChange={e => handleChange("titulo", e.target.value)}
              placeholder="20/1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="torcao">Torção</Label>
            <Input
              id="torcao"
              value={fio.torcao || ""}
              onChange={e => handleChange("torcao", e.target.value)}
              placeholder="Z"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resistencia">Resistência (kgf)</Label>
            <Input
              id="resistencia"
              value={fio.resistencia || ""}
              onChange={e => handleChange("resistencia", e.target.value)}
              placeholder="120"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Input
            id="observacoes"
            value={fio.observacoes || ""}
            onChange={e => handleChange("observacoes", e.target.value)}
            placeholder="Observações"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ativo"
            checked={fio.ativo}
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
          <Link href="/cadastros/fios">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>

      {isEditing && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Fornecedores</h2>
            <Button type="button" onClick={() => setShowFornecedorForm(true)} size="sm" className="gap-2">
              <Plus size={16} /> Adicionar
            </Button>
          </div>

          {fioFornecedores.length > 0 && (
            <div className="space-y-2 mb-4">
              {fioFornecedores.map(ff => (
                <div key={ff.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">{ff.fornecedorNome}</p>
                    <p className="text-sm text-slate-500">{ff.codigoFornecedor}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeFornecedor(ff.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {showFornecedorForm && (
            <div className="p-4 bg-slate-50 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <select
                  value={selectedFornecedor}
                  onChange={e => setSelectedFornecedor(e.target.value)}
                  className="flex-1 p-2 rounded border"
                >
                  <option value="">Selecione fornecedor</option>
                  {fornecedores.map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
                <Link href="/cadastros/fornecedores/novo">
                  <Button type="button" variant="outline" size="sm" className="ml-2 gap-1">
                    <Plus size={14} /> Novo
                  </Button>
                </Link>
              </div>
              <Input
                placeholder="Código do fornecedor"
                value={codigoFornecedor}
                onChange={e => setCodigoFornecedor(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={addFornecedor}>Adicionar</Button>
                <Button variant="outline" onClick={() => setShowFornecedorForm(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}