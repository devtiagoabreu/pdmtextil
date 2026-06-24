"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Scissors, Plus, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { Button } from "@/components/ui/button"
import { gerarRequisicaoCortePdf, gerarRequisicaoCortePdfConsolidado, RequisicaoCorteData } from "@/lib/gerar-requisicao-corte-pdf"

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  SOLICITADO: { label: "Solicitado", classes: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  PROCESSANDO: { label: "Processando", classes: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400" },
  ATENDIDO: { label: "Atendido", classes: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" },
}

export default function ListaRequisicoesCortePage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [gerandoPdf, setGerandoPdf] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    fetch("/api/comercial/requisicoes-corte")
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => toast.error("Erro ao carregar requisições"))
      .finally(() => setLoading(false))
  }, [mounted])

  function toggleSel(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function fetchDetalhe(id: number): Promise<RequisicaoCorteData | null> {
    try {
      const res = await fetch(`/api/comercial/requisicoes-corte/${id}?t=${Date.now()}`)
      if (!res.ok) return null
      const d = await res.json()
      return {
        id: d.id,
        status: d.status,
        observacoes: d.observacoes,
        entreguePor: d.entreguePor,
        createdAt: d.createdAt,
        requisitanteNome: d.requisitanteNome,
        itens: Array.isArray(d.itens) ? d.itens.map((i: any) => ({
          codigoProduto: i.codigoProduto || "",
          ordem: i.ordem || "",
          artigo: i.artigo || "",
          cor: i.cor || "",
          desenho: i.desenho || "",
          quantidade: i.quantidade || "0",
        })) : [],
      }
    } catch {
      return null
    }
  }

  async function gerarPdfUnico(id: number) {
    setGerandoPdf(true)
    const detalhe = await fetchDetalhe(id)
    if (!detalhe) {
      toast.error(`Erro ao carregar requisição #${id}`)
      setGerandoPdf(false)
      return
    }
    await gerarRequisicaoCortePdf(detalhe)
    setGerandoPdf(false)
  }

  async function gerarPdfsSelecionados() {
    if (selected.size === 0) {
      toast.error("Selecione ao menos uma requisição")
      return
    }
    setGerandoPdf(true)
    for (const id of selected) {
      const detalhe = await fetchDetalhe(id)
      if (detalhe) await gerarRequisicaoCortePdf(detalhe)
    }
    setGerandoPdf(false)
  }

  async function gerarConsolidado() {
    if (selected.size === 0) {
      toast.error("Selecione ao menos uma requisição")
      return
    }
    setGerandoPdf(true)
    const detalhes: RequisicaoCorteData[] = []
    for (const id of selected) {
      const d = await fetchDetalhe(id)
      if (d) detalhes.push(d)
    }
    if (detalhes.length > 0) await gerarRequisicaoCortePdfConsolidado(detalhes)
    setGerandoPdf(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/comercial/requisicoes-corte/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao excluir")
      }
      toast.success("Requisição excluída com sucesso")
      setDeleteTarget(null)
      setData(prev => prev.filter(item => item.id !== deleteTarget.id))
      setSelected(prev => { const next = new Set(prev); next.delete(deleteTarget.id); return next })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir")
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Requisições de Corte{info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {data.length} requisição(ões)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data.length > 0 && (
            <>
              <Button
                onClick={gerarPdfsSelecionados}
                disabled={selected.size === 0 || gerandoPdf}
                variant="outline"
                className="gap-2"
              >
                {gerandoPdf ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                PDF ({selected.size})
              </Button>
              <Button
                onClick={gerarConsolidado}
                disabled={selected.size === 0 || gerandoPdf}
                className="gap-2 bg-purple-700 hover:bg-purple-800 text-white"
              >
                {gerandoPdf ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Consolidado ({selected.size})
              </Button>
            </>
          )}
          <Link
            href="/comercial/requisicoes-corte/nova"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Nova Requisição
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Scissors className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma requisição encontrada</p>
            <Link href="/comercial/requisicoes-corte/nova" className="text-sm text-blue-600 hover:underline mt-2">
              Criar primeira requisição
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase w-10">
                    <input
                      type="checkbox"
                      checked={data.length > 0 && selected.size === data.length}
                      onChange={() => {
                        if (selected.size === data.length) setSelected(new Set())
                        else setSelected(new Set(data.map(d => d.id)))
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Requisitante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Cortes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Qtd Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((item: any) => {
                  const statusCfg = STATUS_CONFIG[item.status] ?? { label: item.status, classes: "bg-slate-100 text-slate-600" }
                  const isSel = selected.has(item.id)
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${isSel ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                      onClick={() => router.push(`/comercial/requisicoes-corte/${item.id}`)}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleSel(item.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-200">#{item.id}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.requisitanteNome || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.totalCortes ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.quantidadeTotal ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.classes}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => gerarPdfUnico(item.id)}
                            disabled={gerandoPdf}
                            className="gap-1 text-xs h-8 px-2"
                          >
                            <FileText size={13} />
                            PDF
                          </Button>
                          <Link
                            href={`/comercial/requisicoes-corte/${item.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
                          >
                            Ver
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="text-red-600 dark:text-red-400 hover:underline text-xs font-medium"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Excluir requisição?"
        message={`Tem certeza que deseja excluir a requisição #${deleteTarget?.id}?`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
