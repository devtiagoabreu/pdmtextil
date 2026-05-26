"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  SOLICITADO: { label: "Solicitado", classes: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  PROCESSANDO: { label: "Processando", classes: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400" },
  ATENDIDO: { label: "Atendido", classes: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" },
}

export default function DetalheRequisicaoCortePage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const id = params.id as string
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    codigoProduto: "",
    ordem: "",
    artigo: "",
    cor: "",
    desenho: "",
    quantidade: "",
    observacoes: "",
    entreguePor: "",
    status: "",
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !id) return
    fetch(`/api/comercial/requisicoes-corte/${id}?t=${Date.now()}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then(d => {
        setForm({
          codigoProduto: d.codigoProduto || "",
          ordem: d.ordem || "",
          artigo: d.artigo || "",
          cor: d.cor || "",
          desenho: d.desenho || "",
          quantidade: d.quantidade || "",
          observacoes: d.observacoes || "",
          entreguePor: d.entreguePor || "",
          status: d.status || "",
        })
      })
      .catch(() => toast.error("Erro ao carregar requisição"))
      .finally(() => setLoading(false))
  }, [mounted, id])

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/comercial/requisicoes-corte/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao salvar")
      }
      toast.success("Requisição atualizada com sucesso")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[form.status] ?? { label: form.status, classes: "bg-slate-100 text-slate-600" }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link
          href="/comercial/requisicoes-corte"
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Requisição #{id}{info && <InfoButton content={info} />}
          </h1>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${statusCfg.classes}`}>
            {statusCfg.label}
          </span>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigoProduto">Cód. Produto</Label>
              <Input
                id="codigoProduto"
                value={form.codigoProduto}
                onChange={(e) => handleChange("codigoProduto", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem</Label>
              <Input
                id="ordem"
                value={form.ordem}
                onChange={(e) => handleChange("ordem", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="artigo">Artigo</Label>
              <Input
                id="artigo"
                value={form.artigo}
                onChange={(e) => handleChange("artigo", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cor">Cor</Label>
              <Input
                id="cor"
                value={form.cor}
                onChange={(e) => handleChange("cor", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desenho">Desenho</Label>
              <Input
                id="desenho"
                value={form.desenho}
                onChange={(e) => handleChange("desenho", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidade">
                Quantidade <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantidade"
                value={form.quantidade}
                onChange={(e) => handleChange("quantidade", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={form.observacoes}
              onChange={(e) => handleChange("observacoes", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entreguePor">Entregue por</Label>
            <Input
              id="entreguePor"
              value={form.entreguePor}
              onChange={(e) => handleChange("entreguePor", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={form.status} onValueChange={(v) => v && handleChange("status", v)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOLICITADO">Solicitado</SelectItem>
                <SelectItem value="PROCESSANDO">Processando</SelectItem>
                <SelectItem value="ATENDIDO">Atendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
