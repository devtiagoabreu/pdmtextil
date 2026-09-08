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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ATIVIDADE_TIPO_LABELS } from "@/lib/processos/constantes"

type Atividade = {
  id: number | null
  subprocessoId: string
  nome: string
  tipo: string
  responsavel: string
  ordem: string
  observacoes: string
  ativo: boolean
}

interface Subprocesso {
  id: number
  nome: string
}

export default function ProcessoAtividadeFormPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const info = getInfoContent(pathname)
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null
  const subprocessoIdParam = searchParams.get("subprocessoId")
  const processoIdParam = searchParams.get("processoId")

  const [atividade, setAtividade] = useState<Atividade>({
    id: null,
    subprocessoId: subprocessoIdParam || "",
    nome: "",
    tipo: "MANUAL",
    responsavel: "",
    ordem: "0",
    observacoes: "",
    ativo: true,
  })
  const [saving, setSaving] = useState(false)

  const { data: subprocessos = [] } = useQuery<Subprocesso[]>({
    queryKey: ["proc-subprocessos"],
    queryFn: async () => {
      const res = await fetch("/api/processos/subprocessos")
      if (!res.ok) throw new Error("Falha ao carregar subprocessos")
      return res.json()
    },
  })

  const { data: atividadeData, isLoading: loading } = useQuery<Atividade>({
    queryKey: ["proc-atividade", id],
    queryFn: async () => {
      const res = await fetch(`/api/processos/atividades/${id}`)
      return res.json()
    },
    enabled: !!isEditing && !!id,
  })

  useEffect(() => {
    if (atividadeData) {
      setAtividade({
        id: atividadeData.id,
        subprocessoId: atividadeData.subprocessoId ? String(atividadeData.subprocessoId) : "",
        nome: atividadeData.nome || "",
        tipo: atividadeData.tipo || "MANUAL",
        responsavel: atividadeData.responsavel || "",
        ordem: String(atividadeData.ordem ?? 0),
        observacoes: atividadeData.observacoes || "",
        ativo: atividadeData.ativo ?? true,
      })
    }
  }, [atividadeData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!atividade.nome) {
      toast.error("Nome é obrigatório")
      return
    }
    if (!atividade.subprocessoId) {
      toast.error("Selecione o subprocesso")
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/processos/atividades/${id}` : "/api/processos/atividades"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...atividade,
          subprocessoId: parseInt(atividade.subprocessoId),
          ordem: parseInt(atividade.ordem || "0") || 0,
        }),
      })

      if (res.ok) {
        toast.success(isEditing ? "Atividade atualizada!" : "Atividade criada!")
        router.push(processoIdParam ? `/processos/processos/${processoIdParam}` : "/processos/atividades")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao salvar atividade")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Atividade, value: string | boolean) => {
    setAtividade(prev => ({ ...prev, [field]: value }))
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
        <Link href={processoIdParam ? `/processos/processos/${processoIdParam}` : "/processos/atividades"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Atividade" : "Nova Atividade"}
            {info && <InfoButton content={info} />}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="subprocessoId">Subprocesso *</Label>
          <select
            id="subprocessoId"
            value={atividade.subprocessoId}
            onChange={e => handleChange("subprocessoId", e.target.value)}
            className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
          >
            <option value="">Selecione o subprocesso</option>
            {subprocessos.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.nome}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={atividade.nome}
              onChange={e => handleChange("nome", e.target.value)}
              placeholder="Encarar materiais"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <select
              id="tipo"
              value={atividade.tipo}
              onChange={e => handleChange("tipo", e.target.value)}
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
            >
              {Object.entries(ATIVIDADE_TIPO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Input
              id="responsavel"
              value={atividade.responsavel || ""}
              onChange={e => handleChange("responsavel", e.target.value)}
              placeholder="Nome do responsável"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ordem">Ordem</Label>
            <Input
              id="ordem"
              type="number"
              min={0}
              value={atividade.ordem}
              onChange={e => handleChange("ordem", e.target.value)}
              placeholder="1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            value={atividade.observacoes || ""}
            onChange={e => handleChange("observacoes", e.target.value)}
            placeholder="Observações da atividade"
            rows={2}
          />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" checked={atividade.ativo} onChange={e => handleChange("ativo", e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="ativo">Ativo</Label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
          <Link href={processoIdParam ? `/processos/processos/${processoIdParam}` : "/processos/atividades"}>
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}