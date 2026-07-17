"use client"

import { useEffect, useState, useCallback } from "react"
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChartCard } from "@/components/ui/chart-card"
import { ChartTooltip } from "@/components/ui/chart-tooltip"
import { ClipboardList, FlaskConical, ExternalLink, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useStatuses, hexToRgba } from "@/hooks/use-statuses"

const TREND_COLOR = "#06b4d4"

const MAIN_CARDS = [
  { key: "total", label: "Total", color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-100 dark:bg-slate-800", icon: ClipboardList, statField: "total" },
  { key: "pendentes", label: "Pendentes", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50", icon: FlaskConical, statField: "pendentes" },
  { key: "em-producao", label: "Em Produção", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/50", icon: FlaskConical, statField: "emProducao" },
  { key: "concluidos", label: "Concluídos", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50", icon: FlaskConical, statField: "concluidos" },
]

export default function DashboardAmostraComercial() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { getLabel, getColor } = useStatuses("AMOSTRA_COMERCIAL")

  const [modalFiltro, setModalFiltro] = useState<string | null>(null)
  const [modalLista, setModalLista] = useState<any[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  const [modalTitle, setModalTitle] = useState("")

  useEffect(() => {
    fetch("/api/dashboard/amostra-comercial-stats")
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
      const res = await fetch(`/api/dashboard/amostra-comercial-lista?filtro=${filtro}`)
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

  const statusCards = stats?.statusConfigs?.map((c: any) => {
    const dist = stats?.statusDistribution?.find((d: any) => d.status === c.nome)
    return {
      key: `status-${c.nome}`,
      label: c.rotulo || c.nome,
      color: `text-[${c.cor}]`,
      bg: "bg-white dark:bg-slate-900",
      icon: null,
      total: dist?.total || 0,
      cor: c.cor,
    }
  }) || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Dashboard — Amostras Comerciais{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe as requisições de amostra comercial
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {MAIN_CARDS.map((stat) => (
              <button
                key={stat.key}
                type="button"
                onClick={() => openModal(stat.key, stat.label)}
                className={`rounded-xl border border-slate-200 dark:border-slate-800 ${stat.bg} p-4 card-hover text-left w-full cursor-pointer transition-shadow hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                  <stat.icon size={16} className="text-slate-400 dark:text-slate-500" />
                </div>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stats?.[stat.statField] ?? 0}</p>
              </button>
            ))}
          </div>

          {statusCards.length > 0 && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
              {statusCards.map((card: any) => (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => openModal(card.key, card.label)}
                  className={`rounded-xl border border-slate-200 dark:border-slate-800 ${card.bg} p-3 card-hover text-left w-full cursor-pointer transition-shadow hover:shadow-md`}
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{card.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: card.cor || "#94a3b8" }} />
                    <p className="text-2xl font-bold" style={{ color: card.cor || "#94a3b8" }}>{card.total}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard title="Distribuição por Status" delay={0}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={(stats?.statusDistribution || []).map((s: any) => ({
                      name: getLabel(s.status) || s.status,
                      value: s.total,
                    }))}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                    dataKey="value" label={({ name, value }: any) => value > 0 ? `${name}: ${value}` : ""}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  >
                    {(stats?.statusDistribution || []).map((s: any) => (
                      <Cell key={s.status} fill={getColor(s.status) || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Por Mês" delay={300}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${v || 0} requisições`} />} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} fill={TREND_COLOR} animationDuration={1000} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Tendência" delay={600}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${v || 0} requisições`} />} />
                  <Line type="monotone" dataKey="total" stroke={TREND_COLOR} strokeWidth={2} dot={{ fill: TREND_COLOR, r: 4 }} activeDot={{ r: 7, stroke: TREND_COLOR, strokeWidth: 2, fill: "#fff" }} animationDuration={1200} animationEasing="ease-out" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Requisições Recentes</h2>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              {!stats?.recent || stats.recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma requisição recente</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">As requisições aparecerão aqui</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">#</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Título</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Cliente</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Produto</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Status</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((a: any, i: number) => (
                      <tr key={`req-${a.id}-${i}`} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">#{a.id}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{a.titulo || "—"}</td>
                        <td className="p-4 text-sm text-slate-500">{a.cliente || "—"}</td>
                        <td className="p-4 text-sm">
                          <Link href={`/cadastros/produto-cru/${a.produtoCruId}`} className="flex items-center gap-1.5 group">
                            <div>
                              <span className="text-xs text-slate-400">{a.produtoCodigo}</span>
                              <p className="text-xs text-slate-500 mt-0.5">{a.produtoDescricao}</p>
                            </div>
                            <ExternalLink size={12} className="text-slate-300 group-hover:text-blue-500 shrink-0" />
                          </Link>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{
                            backgroundColor: hexToRgba(getColor(a.status), 0.15),
                            color: getColor(a.status),
                          }}>
                            {getLabel(a.status)}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString("pt-BR") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {modalFiltro && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 bg-black/50" onClick={() => setModalFiltro(null)}>
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[75vh] flex flex-col border border-slate-200 dark:border-slate-700"
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
                  {modalLista.map((item: any, i: number) => (
                    <button
                      key={`${item.id}-${i}`}
                      type="button"
                      onClick={() => { router.push(`/comercial/requisicoes-amostra-comercial/${item.id}`); setModalFiltro(null) }}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                          #{item.id} — {item.titulo || "Sem título"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{item.cliente}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-3 shrink-0">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{
                          backgroundColor: hexToRgba(getColor(item.status), 0.15),
                          color: getColor(item.status),
                        }}>
                          {getLabel(item.status)}
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
