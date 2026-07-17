"use client"

import { useEffect, useState, useCallback } from "react"
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChartCard } from "@/components/ui/chart-card"
import { ChartTooltip } from "@/components/ui/chart-tooltip"
import { Scissors, Clock, CheckCircle, Loader2, X, ArrowRight } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

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

const STATUS_COLORS: Record<string, string> = {
  SOLICITADO: "#f59e0b",
  PROCESSANDO: "#6366f1",
  ATENDIDO: "#22c55e",
}

const CARDS = [
  { key: "total-geral", label: "Total Geral", color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-100 dark:bg-slate-800", statField: "totalGeral" },
  { key: "solicitados", label: "Solicitados", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50", statField: "solicitados" },
  { key: "processando", label: "Processando", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/50", statField: "processando" },
  { key: "atendidos", label: "Atendidos", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50", statField: "atendidos" },
  { key: "este-mes", label: "Este mês", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/50", statField: "totalEsteMes" },
]

export default function DashboardReqCorte() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [modalFiltro, setModalFiltro] = useState<string | null>(null)
  const [modalLista, setModalLista] = useState<any[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  const [modalTitle, setModalTitle] = useState("")

  useEffect(() => {
    fetch("/api/dashboard/requisicoes-corte-stats")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

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
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 p-6 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">Erro ao carregar dados</p>
          <p className="text-sm text-red-500 dark:text-red-500 mt-1">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {CARDS.map((stat) => (
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
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl border border-slate-200 dark:border-slate-800 ${stat.bg} p-3 card-hover`}>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Distribuição por Status" delay={0}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={(stats?.statusDistribution || []).map((s: any) => ({
                      name: STATUS_LABELS[s.status] || s.status,
                      value: s.total,
                    }))}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                    dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  >
                    {(stats?.statusDistribution || []).map((s: any) => (
                      <Cell key={s.status} fill={STATUS_COLORS[s.status] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Requisições por Mês" delay={300}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${v || 0} requisições`} />} />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} activeDot={{ r: 7, stroke: "#6366f1", strokeWidth: 2, fill: "#fff" }} animationDuration={1200} animationEasing="ease-out" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
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
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { router.push(`/comercial/requisicoes-corte/${item.id}`); setModalFiltro(null) }}
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
                    </button>
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
