"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useParams, usePathname, useSearchParams } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type Subprocesso = {
  id: number | null
  processoId: string
  nome: string
  descricao: string
  ordem: string
  ativo: boolean
}

interface Processo {
  id: number
  nome: string
}

export default function ProcessoSubprocessoFormPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const info = getInfoContent(pathname)
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null
  const processoIdParam = searchParams.get("processoId")

  const [subprocesso, setSubprocesso] = useState<Subprocesso>({
    id: null,
    processoId: processoIdParam || "",
    nome: "",
    descricao: "",
    ordem: "0",
    ativo: true,
  })
  const [saving, setSaving] = useState(false)

  const { data: processos = [] } = useQuery<Processo[]>({
    queryKey: ["proc-processos"],
    queryFn: async () => {
      const res = await fetch("/api/processos/processos")
      if (!res.ok) throw new Error("Falha ao carregar processos")
      return res.json()
    },
  })

  const { data: subprocessoData, isLoading: loading } = useQuery<Subprocesso>({
    queryKey: ["proc-subprocesso", id],
    queryFn: async () => {
      const res = await fetch(`/api/processos/subprocessos/${id}`)
      return res.json()
    },
    enabled: !!isEditing && !!id,
  })

  useEffect(() => {
    if (subprocessoData) {
      setSubprocesso({
        id: subprocessoData.id,
        processoId: subprocessoData.processoId ? String(subprocessoData.processoId) : "",
        nome: subprocessoData.nome || "",
        descricao: subprocessoData.descricao || "",
        ordem: String(subprocessoData.ordem ?? 0),
        ativo: subprocessoData.ativo ?? true,
      })
    }
  }, [subprocessoData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!subprocesso.nome) {
      toast.error("Nome é obrigatório")
      return
    }
    if (!subprocesso.processoId) {
      toast.error("Selecione o processo")
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/processos/subprocessos/${id}` : "/api/processos/subprocessos"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...subprocesso,
          processoId: parseInt(subprocesso.processoId),
          ordem: parseInt(subprocesso.ordem || "0") || 0,
        }),
      })

      if (res.ok) {
        toast.success(isEditing ? "Subprocesso atualizado!" : "Subprocesso criado!")
        router.push(subprocesso.processoId ? `/processos/processos/${subprocesso.processoId}` : "/processos/subprocessos")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao salvar subprocesso")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Subprocesso, value: string | boolean) => {
    setSubprocesso(prev => ({ ...prev, [field]: value }))
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
        <Link href={processoIdParam ? `/processos/processos/${processoIdParam}` : "/processos/subprocessos"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Subprocesso" : "Novo Subprocesso"}
            {info && <InfoButton content={info} />}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="processoId">Processo *</Label>
          <select
            id="processoId"
            value={subprocesso.processoId}
            onChange={e => handleChange("processoId", e.target.value)}
            className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
          >
            <option value="">Selecione o processo</option>
            {processos.map((proc) => (
              <option key={proc.id} value={proc.id}>{proc.nome}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            value={subprocesso.nome}
            onChange={e => handleChange("nome", e.target.value)}
            placeholder="Preparação dos fios"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Input
            id="descricao"
            value={subprocesso.descricao || ""}
            onChange={e => handleChange("descricao", e.target.value)}
            placeholder="Descrição do subprocesso"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ordem">Ordem</Label>
          <Input
            id="ordem"
            type="number"
            min={0}
            value={subprocesso.ordem}
            onChange={e => handleChange("ordem", e.target.value)}
            placeholder="1"
          />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" checked={subprocesso.ativo} onChange={e => handleChange("ativo", e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="ativo">Ativo</Label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
          <Link href={processoIdParam ? `/processos/processos/${processoIdParam}` : "/processos/subprocessos"}>
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}