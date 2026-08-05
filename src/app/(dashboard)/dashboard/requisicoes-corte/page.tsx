"use client"

import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Scissors, Clock, CheckCircle, Loader2, X, ArrowRight } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

const ReqCorteCharts = dynamic(() => import("./charts").then((m) => m.ReqCorteCharts), { ssr: false })

const STATUS_LABELS: Record<string, string> = {
  SOLICITADO: "Solicitado",
  PROCESSANDO: "Processando",
  ATENDIDO: "Atendido",
}

const STATUS_BG: Record<string, string> = {
  SOLICITADO: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  PROCESSANDO: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
  ATENDIDO: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
}

const CARDS = [
  { key: "total-geral", label: "Total Geral", color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-100 dark:bg-slate-800", statField: "totalGeral" },
  { key: "solicitados", label: "Solicitados", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50", statField: "solicitados" },
  { key: "processando", label: "Processando", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/50", statField: "processando" },
  { key: "atendidos", label: "Atendidos", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50", statField: "atendidos" },
  { key: "este-mes", label: "Este mês", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/50", statField: "totalEsteMes" },
]

export default function DashboardReqCorte() {
  const [modalFiltro, setModalFiltro] = useState<string | null>(null)
  const [modalLista, setModalLista] = useState<any[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  const [modalTitle, setModalTitle] = useState("")

  const { data: stats, isLoading: loading, error } = useQuery<any>({
    queryKey: ["dashboard", "requisicoes-corte-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/requisicoes-corte-stats")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
  })
  const errorMsg = (error as any)?.message || ""

  const openModal = useCallback(async (filtro: string, label: string) => {
    setModalTitle(label)
    setModalFiltro(filtro)
    setModalLoading(true)
    setModalLista([])
    try {
      const res = await fetch(`/api/dashboard/requisicoes-corte-lista?filtro=${filtro}`)
      if (res.ok) {
        const data = await res.json()
        setModalLista(Array.isArray(data) ? data : [])
      }
    } catch {
      setModalLista([])
    } finally {
      setModalLoading(false)
    }
  }, [])

  const pathname = usePathname()
  const info = getInfoContent(pathname)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Dashboard Requisições de Corte{info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe todas as requisições de corte
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Carregando...</div>
      ) : errorMsg ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 p-6 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">Erro ao carregar dados</p>
          <p className="text-sm text-red-500 dark:text-red-500 mt-1">{errorMsg}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {CARDS.map((stat: any) => (
              <button
                key={stat.key}
                type="button"
                onClick={() => openModal(stat.key, stat.label)}
                className={`rounded-xl border border-slate-200 dark:border-slate-800 ${stat.bg} p-4 card-hover text-left w-full cursor-pointer transition-shadow hover:shadow-md`}
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stats?.[stat.statField] ?? 0}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Total de Cortes", value: stats?.totalCortes ?? 0, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/50" },
              { label: "Qtd Total (Itens)", value: stats?.totalItens ?? 0, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-950/50" },
            ].map((stat: any) => (
              <div key={stat.label} className={`rounded-xl border border-slate-200 dark:border-slate-800 ${stat.bg} p-3 card-hover`}>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <ReqCorteCharts stats={stats} />
        </>
      )}

      {modalFiltro && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 bg-black/50" onClick={() => setModalFiltro(null)}>
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[75vh] flex flex-col border border-slate-200 dark:border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{modalTitle}</h2>
              <button type="button" onClick={() => setModalFiltro(null)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex-1">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                </div>
              ) : modalLista.length === 0 ? (
                <p className="text-center text-slate-500 py-12">Nenhum registro encontrado</p>
              ) : (
                <div className="space-y-1">
                  {modalLista.map((item: any) => (
                    <Link
                      key={item.id}
                      href={`/comercial/requisicoes-corte/${item.id}`}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                          #{item.id} — {item.requisitanteNome || "—"} ({item.totalCortes} cortes, qtd {item.quantidadeTotal})
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-3 shrink-0">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BG[item.status] || "bg-slate-100 text-slate-600"}`}>
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                        <span className="text-xs text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : ""}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
