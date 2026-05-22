"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2, Plus, X, Search } from "lucide-react"
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
  tratamento?: string | null
  tensaoUrdume?: string | null
  largura?: string | null
  observacoes?: string | null
  ativo: boolean
  idIntegracao?: string | null
}

type FioOption = {
  id: number
  codigoFio: string
  nome: string
  idIntegracao: string | null
}

type FioSelecionado = {
  fioId: number
  fioNome: string
  fioCodigo: string
  fioIdIntegracao: string | null
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
    tratamento: "",
    tensaoUrdume: "",
    largura: "",
    observacoes: "",
    ativo: true,
    idIntegracao: "",
  })
  const [fiosSelecionados, setFiosSelecionados] = useState<FioSelecionado[]>([])
  const [fiosDisponiveis, setFiosDisponiveis] = useState<FioOption[]>([])
  const [fioSearch, setFioSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [fiosRes] = await Promise.all([
          fetch("/api/cadastros/fios"),
        ])

        if (fiosRes.ok) {
          const fios: FioOption[] = await fiosRes.json()
          setFiosDisponiveis(fios.filter(f => f.id))
        }

        if (isEditing && id) {
          const baseRes = await fetch(`/api/cadastros/bases-urdume/${id}`)
          if (baseRes.ok) {
            const data = await baseRes.json()
            setBase({
              id: data.id,
              codigoBase: data.codigoBase || "",
              codigoCompleto: data.codigoCompleto || "",
              nome: data.nome || "",
              descricao: data.descricao || "",
              densidade: data.densidade || "",
              tratamento: data.tratamento || "",
              tensaoUrdume: data.tensaoUrdume || "",
              largura: data.largura || "",
              observacoes: data.observacoes || "",
              ativo: data.ativo ?? true,
              idIntegracao: data.idIntegracao || "",
            })
            if (data.fiosLista) {
              setFiosSelecionados(data.fiosLista.map((f: any) => ({
                fioId: f.fioId,
                fioNome: f.fioNome || "",
                fioCodigo: f.fioCodigo || "",
                fioIdIntegracao: f.fioIdIntegracao || null,
              })))
            }
          } else {
            const err = await baseRes.json().catch(() => ({ error: "Erro ao carregar" }))
            toast.error(err.error || "Erro ao carregar base")
          }
        }

        if (isEditing && id) {
          const baseRes = await fetch(`/api/cadastros/bases-urdume/${id}`)
          if (baseRes.ok) {
            const data = await baseRes.json()
            setBase({
              id: data.id,
              codigoBase: data.codigoBase || "",
              codigoCompleto: data.codigoCompleto || "",
              nome: data.nome || "",
              descricao: data.descricao || "",
              densidade: data.densidade || "",
              tratamento: data.tratamento || "",
              tensaoUrdume: data.tensaoUrdume || "",
              largura: data.largura || "",
              observacoes: data.observacoes || "",
              ativo: data.ativo ?? true,
              idIntegracao: data.idIntegracao || "",
            })
            if (data.fiosLista) {
              setFiosSelecionados(data.fiosLista.map((f: any) => ({
                fioId: f.fioId,
                fioNome: f.fioNome || "",
                fioCodigo: f.fioCodigo || "",
                fioIdIntegracao: f.fioIdIntegracao || null,
              })))
            }
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
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

      const body = {
        ...base,
        densidade: base.densidade ? base.densidade.trim() : "",
        fiosLista: fiosSelecionados.map(f => ({ fioId: f.fioId })),
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  const adicionarFio = (fio: FioOption) => {
    if (fiosSelecionados.some(f => f.fioId === fio.id)) return
    setFiosSelecionados(prev => [...prev, { fioId: fio.id, fioNome: fio.nome, fioCodigo: fio.codigoFio, fioIdIntegracao: fio.idIntegracao || null }])
    setFioSearch("")
  }

  const removerFio = (fioId: number) => {
    setFiosSelecionados(prev => prev.filter(f => f.fioId !== fioId))
  }

  const fiosFiltrados = fiosDisponiveis.filter(f =>
    !fiosSelecionados.some(s => s.fioId === f.id) &&
    (f.nome.toLowerCase().includes(fioSearch.toLowerCase()) ||
     f.codigoFio.toLowerCase().includes(fioSearch.toLowerCase()))
  ).slice(0, 10)

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

        <div className="space-y-3">
          <Label>Fios que compõem o urdume</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Buscar fio para adicionar..."
              value={fioSearch}
              onChange={e => setFioSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {fioSearch && (
            <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 max-h-48 overflow-y-auto">
              {fiosFiltrados.length === 0 ? (
                <p className="p-3 text-sm text-slate-400">Nenhum fio encontrado</p>
              ) : (
                fiosFiltrados.map(fio => (
                  <button
                    key={fio.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    onClick={() => adicionarFio(fio)}
                  >
                    <Plus size={14} className="text-slate-400" />
                    <span className="font-medium">{fio.codigoFio}</span>
                    {fio.idIntegracao && <span className="text-xs text-slate-400">({fio.idIntegracao})</span>}
                    <span className="text-slate-500">{fio.nome}</span>
                  </button>
                ))
              )}
            </div>
          )}
          {fiosSelecionados.length > 0 && (
            <div className="space-y-1">
              {fiosSelecionados.map(fio => (
                <div key={fio.fioId} className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2">
                  <div className="text-sm">
                    <span className="font-medium">{fio.fioCodigo}</span>
                    {fio.fioIdIntegracao && <span className="text-xs text-slate-400 ml-1.5">({fio.fioIdIntegracao})</span>}
                    <span className="text-slate-500 ml-2">{fio.fioNome}</span>
                  </div>
                  <button type="button" onClick={() => removerFio(fio.fioId)} className="text-red-400 hover:text-red-600">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="densidade">Densidade (Qtde Fios)</Label>
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
            <Label htmlFor="tratamento">Tratamento</Label>
            <Input
              id="tratamento"
              value={base.tratamento || ""}
              onChange={e => handleChange("tratamento", e.target.value)}
              placeholder="Engomagem"
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
          <input type="checkbox" id="ativo" checked={base.ativo} onChange={e => handleChange("ativo", e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="ativo">Ativo</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="idIntegracao">ID Integração (ERP/WMS/CRM/OUTROS)</Label>
          <Input id="idIntegracao" value={base.idIntegracao || ""} onChange={e => handleChange("idIntegracao", e.target.value)} placeholder="Código do sistema externo" />
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