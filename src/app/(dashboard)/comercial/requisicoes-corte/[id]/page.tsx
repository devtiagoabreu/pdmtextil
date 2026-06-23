"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
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

interface ItemLinha {
  id?: number
  codigoProduto: string
  ordem: string
  artigo: string
  cor: string
  desenho: string
  quantidade: string
}

function itemVazio(): ItemLinha {
  return { codigoProduto: "", ordem: "", artigo: "", cor: "", desenho: "", quantidade: "" }
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
  const [observacoes, setObservacoes] = useState("")
  const [entreguePor, setEntreguePor] = useState("")
  const [status, setStatus] = useState("")
  const [itens, setItens] = useState<ItemLinha[]>([])
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string; cor?: string }[]>([])
  const [requisitanteNome, setRequisitanteNome] = useState("")

  useEffect(() => {
    setMounted(true)
    fetch("/api/admin/status?tipo=REQUISICAO_CORTE")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setStatusOptions(data.map((s: any) => ({ value: s.nome, label: s.rotulo || s.nome, cor: s.cor })))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!mounted || !id) return
    fetch(`/api/comercial/requisicoes-corte/${id}?t=${Date.now()}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then(d => {
        setObservacoes(d.observacoes || "")
        setEntreguePor(d.entreguePor || "")
        setStatus(d.status || "")
        setRequisitanteNome(d.requisitanteNome || "")
        setItens(Array.isArray(d.itens) ? d.itens : [])
      })
      .catch(() => toast.error("Erro ao carregar requisição"))
      .finally(() => setLoading(false))
  }, [mounted, id])

  const handleItemChange = (index: number, field: keyof ItemLinha, value: string) => {
    setItens(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addItem = () => {
    setItens(prev => [...prev, itemVazio()])
  }

  const removeItem = (index: number) => {
    if (itens.length <= 1) return
    setItens(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    const itensValidos = itens.filter(item => item.quantidade.trim())
    if (itensValidos.length === 0) {
      toast.error("Adicione pelo menos um item com quantidade")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/comercial/requisicoes-corte/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: itensValidos, observacoes, entreguePor, status }),
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

  const statusCfg = STATUS_CONFIG[status] ?? { label: status, classes: "bg-slate-100 text-slate-600" }
  const totalCortes = itens.length
  const totalQtd = itens.reduce((acc, item) => {
    const num = parseFloat(item.quantidade.replace(/[^0-9.,]/g, "").replace(",", "."))
    return acc + (isNaN(num) ? 0 : num)
  }, 0)

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link
          href="/comercial/requisicoes-corte"
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Requisição #{id}{info && <InfoButton content={info} />}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.classes}`}>
              {statusCfg.label}
            </span>
            <span className="text-sm text-slate-500">{totalCortes} corte(s) — Qtd total: {totalQtd}</span>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Itens de Corte</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Cód. Produto</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Ordem</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Artigo</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Cor</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Desenho</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Qtd <span className="text-red-500">*</span></th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {itens.map((item, index) => (
                <tr key={item.id ?? index}>
                  <td className="px-3 py-2">
                    <Input
                      value={item.codigoProduto}
                      onChange={(e) => handleItemChange(index, "codigoProduto", e.target.value)}
                      className="h-9 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={item.ordem}
                      onChange={(e) => handleItemChange(index, "ordem", e.target.value)}
                      className="h-9 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={item.artigo}
                      onChange={(e) => handleItemChange(index, "artigo", e.target.value)}
                      className="h-9 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={item.cor}
                      onChange={(e) => handleItemChange(index, "cor", e.target.value)}
                      className="h-9 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={item.desenho}
                      onChange={(e) => handleItemChange(index, "desenho", e.target.value)}
                      className="h-9 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={item.quantidade}
                      onChange={(e) => handleItemChange(index, "quantidade", e.target.value)}
                      className="h-9 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    {itens.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
          <Plus size={14} />
          Adicionar Item
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entreguePor">Entregue por</Label>
            <Input
              id="entreguePor"
              value={entreguePor}
              onChange={(e) => setEntreguePor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v: string | null) => { if (v) setStatus(v) }}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
