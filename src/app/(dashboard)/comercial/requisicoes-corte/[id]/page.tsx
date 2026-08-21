"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, FileText, Copy, ChevronUp, ChevronDown } from "lucide-react"
import OcrInput from "@/components/ui/ocr-input"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { SuggestionInput } from "@/components/ui/suggestion-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { gerarRequisicaoCortePdf } from "@/lib/gerar-requisicao-corte-pdf"

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
  clienteId: number | null
  fornecedorId: number | null
  representanteId: number | null
}

function itemVazio(): ItemLinha {
  return { codigoProduto: "", ordem: "", artigo: "", cor: "", desenho: "", quantidade: "", clienteId: null, fornecedorId: null, representanteId: null }
}

function copiarItem(item: ItemLinha): ItemLinha {
  return { ...item, id: undefined }
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
  const [dataSolicitacao, setDataSolicitacao] = useState("")
  const [dataEntrega, setDataEntrega] = useState("")
  const [clienteIdGlobal, setClienteIdGlobal] = useState<number | null>(null)
  const [fornecedorIdGlobal, setFornecedorIdGlobal] = useState<number | null>(null)
  const [representanteIdGlobal, setRepresentanteIdGlobal] = useState<number | null>(null)
  const [status, setStatus] = useState("")
  const [itens, setItens] = useState<ItemLinha[]>([])
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string; cor?: string }[]>([])
  const [requisitanteNome, setRequisitanteNome] = useState("")

  const [clientes, setClientes] = useState<{ id: number; nome: string }[]>([])
  const [fornecedores, setFornecedores] = useState<{ id: number; nome: string }[]>([])
  const [representantes, setRepresentantes] = useState<{ id: number; nome: string }[]>([])

  const [dialogCopiarAberto, setDialogCopiarAberto] = useState(false)
  const [qtdCopias, setQtdCopias] = useState("1")

  useEffect(() => {
    setMounted(true)
    fetch("/api/admin/status?tipo=REQUISICAO_CORTE")
      .then((r: any) => r.json())
      .then((data: any) => {
        if (Array.isArray(data)) setStatusOptions(data.map((s: any) => ({ value: s.nome, label: s.rotulo || s.nome, cor: s.cor })))
      })
      .catch(console.error)
    fetch("/api/clientes").then(r => r.json()).then(setClientes).catch(() => {})
    fetch("/api/cadastros/fornecedores?limit=100").then(r => r.json()).then(d => setFornecedores(Array.isArray(d) ? d : [])).catch(() => {})
    fetch("/api/representantes").then(r => r.json()).then(setRepresentantes).catch(() => {})
  }, [])

  useEffect(() => {
    if (!mounted || !id) return
    fetch(`/api/comercial/requisicoes-corte/${id}?t=${Date.now()}`)
      .then((res: any) => { if (!res.ok) throw new Error(); return res.json() })
      .then((d: any) => {
        setObservacoes(d.observacoes || "")
        setEntreguePor(d.entreguePor || "")
        setDataSolicitacao(d.dataSolicitacao || "")
        setDataEntrega(d.dataEntrega || "")
        setClienteIdGlobal(d.clienteId || null)
        setFornecedorIdGlobal(d.fornecedorId || null)
        setRepresentanteIdGlobal(d.representanteId || null)
        setStatus(d.status || "")
        setRequisitanteNome(d.requisitanteNome || "")
        setItens(Array.isArray(d.itens) ? d.itens : [])
      })
      .catch(() => toast.error("Erro ao carregar requisição"))
      .finally(() => setLoading(false))
  }, [mounted, id])

  const handleItemChange = (index: number, field: keyof ItemLinha, value: any) => {
    setItens(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addItem = () => {
    setItens(prev => [...prev, itemVazio()])
  }

  const copiarItemAtual = () => {
    const qtd = parseInt(qtdCopias) || 1
    setItens(prev => {
      const ultimo = prev[prev.length - 1]
      const copias = Array.from({ length: qtd }, () => copiarItem(ultimo))
      return [...prev, ...copias]
    })
    setDialogCopiarAberto(false)
    setQtdCopias("1")
    toast.success(`${qtd} cópia(s) adicionada(s)`)
  }

  const moverItem = (index: number, direcao: -1 | 1) => {
    setItens(prev => {
      const novoIndex = index + direcao
      if (novoIndex < 0 || novoIndex >= prev.length) return prev
      const next = [...prev]
      const temp = next[index]
      next[index] = next[novoIndex]
      next[novoIndex] = temp
      return next
    })
  }

  const removeItem = (index: number) => {
    if (itens.length <= 1) return
    setItens(prev => prev.filter((_: any, i: any) => i !== index))
  }

  const handleOcrItens = (novosItens: any[]) => {
    setItens(prev => [
      ...prev.filter((item: any) => item.quantidade.trim()),
      ...novosItens.map((item: any) => ({
        codigoProduto: item.codigoProduto || "",
        ordem: item.ordem || "",
        artigo: item.artigo || "",
        cor: item.cor || "",
        desenho: item.desenho || "",
        quantidade: item.quantidade || "",
        clienteId: null,
        fornecedorId: null,
        representanteId: null,
      })),
    ])
  }

  const handleSave = async () => {
    const itensValidos = itens.filter((item: any) => item.quantidade.trim())
    if (itensValidos.length === 0) {
      toast.error("Adicione pelo menos um item com quantidade")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/comercial/requisicoes-corte/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: itensValidos, observacoes, entreguePor, status, dataSolicitacao, dataEntrega, clienteId: clienteIdGlobal, fornecedorId: fornecedorIdGlobal, representanteId: representanteIdGlobal }),
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
  const totalQtd = itens.reduce((acc: any, item: any) => {
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
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => gerarRequisicaoCortePdf({
              id: parseInt(id),
              status,
              observacoes,
              entreguePor,
              requisitanteNome,
              createdAt: undefined,
              itens,
            })}
            className="gap-2"
          >
            <FileText size={16} />
            PDF
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Itens de Corte</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-3 py-2 w-8"></th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Cód. Produto</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Ordem</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Artigo</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Cor</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Desenho</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Qtd <span className="text-red-500">*</span></th>
                <th className="px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase">Cliente</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase">Fornec.</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase">Repr.</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {itens.map((item: any, index: any) => (
                <tr key={item.id ?? index}>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moverItem(index, -1)}
                        disabled={index === 0}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed p-0"
                        title="Mover para cima"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moverItem(index, 1)}
                        disabled={index === itens.length - 1}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed p-0"
                        title="Mover para baixo"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <SuggestionInput
                      value={item.codigoProduto}
                      onChange={(v) => handleItemChange(index, "codigoProduto", v)}
                      campo="codigoProduto"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <SuggestionInput
                      value={item.ordem}
                      onChange={(v) => handleItemChange(index, "ordem", v)}
                      campo="ordem"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <SuggestionInput
                      value={item.artigo}
                      onChange={(v) => handleItemChange(index, "artigo", v)}
                      campo="artigo"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <SuggestionInput
                      value={item.cor}
                      onChange={(v) => handleItemChange(index, "cor", v)}
                      campo="cor"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <SuggestionInput
                      value={item.desenho}
                      onChange={(v) => handleItemChange(index, "desenho", v)}
                      campo="desenho"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={item.quantidade}
                      onChange={(e) => handleItemChange(index, "quantidade", e.target.value)}
                      className="h-9 text-sm"
                    />
                  </td>
                   <td className="px-2 py-2">
                      <Select value={item.clienteId != null ? String(item.clienteId) : ""} onValueChange={(v) => handleItemChange(index, "clienteId", v && v !== "none" ? Number(v) : null)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {clientes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-2">
                      <Select value={item.fornecedorId != null ? String(item.fornecedorId) : ""} onValueChange={(v) => handleItemChange(index, "fornecedorId", v && v !== "none" ? Number(v) : null)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {fornecedores.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-2">
                      <Select value={item.representanteId != null ? String(item.representanteId) : ""} onValueChange={(v) => handleItemChange(index, "representanteId", v && v !== "none" ? Number(v) : null)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {representantes.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
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

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
            <Plus size={14} />
            Adicionar Item
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setQtdCopias("1")
              setDialogCopiarAberto(true)
            }}
            className="gap-1"
          >
            <Copy size={14} />
            Copiar Item
          </Button>
          <OcrInput onItensImportados={handleOcrItens} />
        </div>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataSolicitacao">Data de Solicitação</Label>
              <Input
                id="dataSolicitacao"
                type="date"
                value={dataSolicitacao}
                onChange={(e) => setDataSolicitacao(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataEntrega">Data de Entrega</Label>
              <Input
                id="dataEntrega"
                type="date"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clienteGlobal">Cliente (geral)</Label>
              <Select value={clienteIdGlobal != null ? String(clienteIdGlobal) : ""} onValueChange={(v) => setClienteIdGlobal(v && v !== "none" ? Number(v) : null)}>
                <SelectTrigger id="clienteGlobal">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {clientes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fornecedorGlobal">Fornecedor (geral)</Label>
              <Select value={fornecedorIdGlobal != null ? String(fornecedorIdGlobal) : ""} onValueChange={(v) => setFornecedorIdGlobal(v && v !== "none" ? Number(v) : null)}>
                <SelectTrigger id="fornecedorGlobal">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {fornecedores.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="representanteGlobal">Representante (geral)</Label>
              <Select value={representanteIdGlobal != null ? String(representanteIdGlobal) : ""} onValueChange={(v) => setRepresentanteIdGlobal(v && v !== "none" ? Number(v) : null)}>
                <SelectTrigger id="representanteGlobal">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {representantes.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v: string | null) => { if (v) setStatus(v) }}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s: any) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {dialogCopiarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-6 w-80 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Copiar último item</h3>
            <p className="text-sm text-slate-500">
              Quantas cópias do último item deseja adicionar?
            </p>
            <Input
              type="number"
              min="1"
              max="50"
              value={qtdCopias}
              onChange={(e) => setQtdCopias(e.target.value)}
              className="h-9 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  copiarItemAtual()
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogCopiarAberto(false)}
              >
                Cancelar
              </Button>
              <Button type="button" size="sm" onClick={copiarItemAtual} className="bg-blue-600 hover:bg-blue-700 text-white">
                Copiar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
