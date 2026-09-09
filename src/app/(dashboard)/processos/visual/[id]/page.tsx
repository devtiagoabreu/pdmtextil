"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useParams, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { DIAGRAMA_TIPO_LABELS } from "@/lib/processos/constantes"
import EditorDiagrama, { type DiagramaRegistro } from "../components/editor"

export default function ProcessoDiagramaPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [novo, setNovo] = useState({ nome: "", tipo: "FLUXOGRAMA", descricao: "" })
  const [saving, setSaving] = useState(false)

  const { data: diagrama, isLoading: carregando } = useQuery<DiagramaRegistro>({
    queryKey: ["proc-diagrama", id],
    queryFn: async () => {
      const res = await fetch(`/api/processos/diagramas/${id}`)
      if (!res.ok) throw new Error("Falha ao carregar diagrama")
      return res.json()
    },
    enabled: !!isEditing && !!id,
  })

  async function criarDiagrama(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!novo.nome) {
      toast.error("Nome é obrigatório")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/processos/diagramas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...novo, ativo: true }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar diagrama")
      }
      const criado = (await res.json()) as DiagramaRegistro
      toast.success("Diagrama criado! Agora monte o fluxo.")
      router.push(`/processos/visual/${criado.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar diagrama")
    } finally {
      setSaving(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    )
  }

  if (!isEditing || !diagrama) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link href="/processos/visual">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Novo Diagrama
              {info && <InfoButton content={info} />}
            </h1>
          </div>
        </div>

        <form onSubmit={criarDiagrama} className="space-y-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={novo.nome}
              onChange={(e) => setNovo((n) => ({ ...n, nome: e.target.value }))}
              placeholder="Fluxograma de recebimento"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de diagrama</Label>
            <select
              id="tipo"
              value={novo.tipo}
              onChange={(e) => setNovo((n) => ({ ...n, tipo: e.target.value }))}
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
            >
              {Object.entries(DIAGRAMA_TIPO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={novo.descricao}
              onChange={(e) => setNovo((n) => ({ ...n, descricao: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="flex gap-4">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              Criar
            </Button>
            <Link href="/processos/visual">
              <Button variant="outline" type="button">Cancelar</Button>
            </Link>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/processos/visual">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            Editor de Diagrama
            {info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {diagrama.nome} — edite o modelo semântico e as representações
          </p>
        </div>
      </div>
      <EditorDiagrama diagrama={diagrama} />
    </div>
  )
}