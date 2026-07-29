"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { FlaskConical, Plus, Search, Trash2, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { useStatuses, hexToRgba } from "@/hooks/use-statuses"
import { gerarRequisicaoAmostraComercialPdf } from "@/lib/gerar-requisicao-amostra-comercial-pdf"

export default function ListaRequisicoesAmostraComercialPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [data, setData] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [mounted, setMounted] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState<number | null>(null)
  const { getLabel, getColor } = useStatuses("AMOSTRA_COMERCIAL")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    fetch("/api/requisicoes-amostra-comercial")
      .then((res: any) => { if (!res.ok) throw new Error(); return res.json() })
      .then((d: any) => {
        const arr = Array.isArray(d) ? d : []
        setData(arr)
        setFiltered(arr)
      })
      .catch(() => toast.error("Erro ao carregar requisiÃ§Ãµes"))
      .finally(() => setLoading(false))
  }, [mounted])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      data.filter((item: any) =>
        String(item.id).includes(q) ||
        (item.titulo || "").toLowerCase().includes(q) ||
        (item.cliente || "").toLowerCase().includes(q) ||
        (item.produtoCodigo || "").toLowerCase().includes(q) ||
        (item.produtoDescricao || "").toLowerCase().includes(q)
      )
    )
  }, [search, data])

  const handleGerarPdf = useCallback(async (id: number) => {
    setGerandoPdf(id)
    await gerarRequisicaoAmostraComercialPdf(id)
    setGerandoPdf(null)
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/requisicoes-amostra-comercial/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao excluir")
      }
      toast.success("RequisiÃ§Ã£o excluÃ­da com sucesso")
      setDeleteTarget(null)
      setData((prev: any) => prev.filter((item: any) => item.id !== deleteTarget.id))
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
            RequisiÃ§Ãµes de Amostra Comercial{info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {filtered.length} requisiÃ§Ã£o(Ãµes)
          </p>
        </div>
        <Link prefetch={false}
          href="/comercial/requisicoes-amostra-comercial/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Nova RequisiÃ§Ã£o
        </Link>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
        <Search size={16} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Buscar por ID, tÃ­tulo, cliente ou produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
        />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FlaskConical className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma requisiÃ§Ã£o encontrada</p>
            <Link prefetch={false} href="/comercial/requisicoes-amostra-comercial/novo" className="text-sm text-blue-600 hover:underline mt-2">
              Criar primeira requisiÃ§Ã£o
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">TÃ­tulo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Produto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">AÃ§Ãµes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => router.push(`/comercial/requisicoes-amostra-comercial/${item.id}`)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-200">#{item.id}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{item.titulo || "â€”"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.cliente || "â€”"}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                        {item.produtoCodigo || "â€”"}
                      </span>
                      {item.produtoDescricao && (
                        <p className="text-xs text-slate-400 line-clamp-1">{item.produtoDescricao}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{
                        backgroundColor: hexToRgba(getColor(item.status), 0.15),
                        color: getColor(item.status),
                      }}>
                        {getLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : "â€”"}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Link prefetch={false}
                          href={`/comercial/requisicoes-amostra-comercial/${item.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
                        >
                          Visualizar
                        </Link>
                        <button
                          onClick={() => handleGerarPdf(item.id)}
                          disabled={gerandoPdf === item.id}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          {gerandoPdf === item.id ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                          {gerandoPdf === item.id ? "..." : "PDF"}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="text-red-600 dark:text-red-400 hover:underline text-xs font-medium inline-flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Excluir requisiÃ§Ã£o?"
        message={`Tem certeza que deseja excluir a requisiÃ§Ã£o #${deleteTarget?.id} â€” ${deleteTarget?.titulo || ""}?`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
