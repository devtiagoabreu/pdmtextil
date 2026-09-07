"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import Link from "next/link"
import { Suspense, useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { PlusCircle, Receipt, Search, ChevronLeft, ChevronRight, Trash2, Pencil, FileText, Package } from "lucide-react"
import { toast } from "sonner"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { STATUS_FATURAMENTO_LABELS, STATUS_FATURAMENTO_CORES } from "@/lib/crm/documento-venda"
import type { FaturamentoResumo } from "./types"

const PAGE_SIZE = 50

function formatarMoeda(v: number | string | null | undefined) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatarData(d: string | null | undefined) {
  if (!d) return "—"
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR")
}

type FaturamentosPage = {
  data: FaturamentoResumo[]
  total: number
  page: number
  totalPages: number
  limit: number
}

async function fetchFaturamentosPaginated(params: { page: number; q: string; status: string }) {
  const sp = new URLSearchParams()
  sp.set("page", String(params.page))
  sp.set("limit", String(PAGE_SIZE))
  if (params.q) sp.set("q", params.q)
  if (params.status && params.status !== "all") sp.set("status", params.status)
  const res = await fetch(`/api/crm/faturamentos?${sp}`)
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json() as Promise<FaturamentosPage>
}

function FaturamentosPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [excluirFaturamento, setExcluirFaturamento] = useState<FaturamentoResumo | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const queryClient = useQueryClient()

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 400)
  }, [])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const { data: tableData, isLoading } = useQuery<FaturamentosPage>({
    queryKey: ["crm-faturamentos", page, debouncedSearch, statusFilter],
    queryFn: () => fetchFaturamentosPaginated({ page, q: debouncedSearch, status: statusFilter }),
    retry: 1,
  })

  const rows = tableData?.data || []
  const totalRows = tableData?.total || 0
  const totalPages = tableData?.totalPages || 0

  const fromRow = totalRows === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const toRow = Math.min(page * PAGE_SIZE, totalRows)

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/crm/faturamentos/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao excluir")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Faturamento excluído com sucesso")
      setExcluirFaturamento(null)
      queryClient.invalidateQueries({ queryKey: ["crm-faturamentos"] })
      queryClient.invalidateQueries({ queryKey: ["crm-oportunidades"] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
      setExcluirFaturamento(null)
    },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Faturamentos{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Carregando..." : totalRows > 0 ? `${fromRow}-${toRow} de ${totalRows} faturamento(s)` : "0 faturamentos"}
          </p>
        </div>
        <Link
          href="/comercial/crm/faturamentos/novo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle size={14} />
          Novo Faturamento
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por número, referência ou oportunidade..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filtrar por status"
        >
          <option value="all">Todos os status</option>
          {Object.entries(STATUS_FATURAMENTO_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {debouncedSearch ? "Nenhum faturamento encontrado para essa busca" : "Nenhum faturamento encontrado"}
            </p>
            <Link href="/comercial/crm/faturamentos/novo" className="text-sm text-blue-600 hover:underline mt-2">
              Registrar primeiro faturamento
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Número</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden sm:table-cell">Oportunidade</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden lg:table-cell">Emissão</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Total</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden md:table-cell">Itens</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Status</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((f) => (
                    <tr
                      key={f.id}
                      onClick={() => router.push(`/comercial/crm/faturamentos/${f.id}`)}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm font-medium text-slate-900 dark:text-slate-200">
                        <span className="inline-flex items-center gap-1">
                          <FileText size={12} className="text-slate-400" />
                          {f.numero || `#${f.id}`}
                        </span>
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                        {f.oportunidadeTitulo || `Oportunidade #${f.oportunidadeId}`}
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                        {formatarData(f.dataEmissao)}
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatarMoeda(f.total)}
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1">
                          <Package size={12} className="text-slate-400" />
                          {f.itensCount ?? 0}
                        </span>
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3">
                        <span className={`inline-flex text-[10px] px-1.5 md:px-2 py-0.5 rounded-full font-medium ${STATUS_FATURAMENTO_CORES[f.status] || ""}`}>
                          {STATUS_FATURAMENTO_LABELS[f.status] || f.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/comercial/crm/faturamentos/${f.id}`}
                            className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                            title="Editar faturamento"
                          >
                            <Pencil size={16} className="text-blue-500" />
                          </Link>
                          <button
                            onClick={() => setExcluirFaturamento(f)}
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                            title="Excluir faturamento"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Página {page} de {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                          pageNum === page
                            ? "bg-blue-600 text-white"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        open={!!excluirFaturamento}
        title="Excluir faturamento"
        message={`Tem certeza que deseja excluir o faturamento${excluirFaturamento?.numero ? ` "${excluirFaturamento.numero}"` : ` #${excluirFaturamento?.id}`}?`}
        subMessage="Os itens vinculados também serão removidos."
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => excluirFaturamento && deleteMutation.mutate(excluirFaturamento.id)}
        onCancel={() => setExcluirFaturamento(null)}
      />
    </div>
  )
}

export default function FaturamentosPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <FaturamentosPageContent />
    </Suspense>
  )
}