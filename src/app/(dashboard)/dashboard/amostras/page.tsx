"use client"

import { useEffect, useState, useCallback } from "react"
import { PieChart, Pie, BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ClipboardList, FlaskConical, ThumbsUp, ThumbsDown, Clock, ExternalLink, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
}

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: "#eab308",
  APROVADO: "#22c55e",
  REPROVADO: "#ef4444",
}

const TIPO_LABELS: Record<string, string> = {
  TECIDO_CRU: "Tecido Cru",
  ACABAMENTO: "Acabamento",
}

const TIPO_CHART_COLORS: Record<string, string> = {
  TECIDO_CRU: "#06b6d4",
  ACABAMENTO: "#f97316",
}

const TIPO_BG: Record<string, string> = {
  TECIDO_CRU: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  ACABAMENTO: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
}

const TREND_COLOR = "#06b6d4"

const STATUS_BG: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  APROVADO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REPROVADO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

const CARDS = [
  { key: "total-geral", label: "Total Geral", color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-100 dark:bg-slate-800", icon: ClipboardList, statField: "totalGeral" },
  { key: "tecido-cru", label: "Tecido Cru", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/50", icon: FlaskConical, statField: "totalCru" },
  { key: "acabamento", label: "Acabamento", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/50", icon: FlaskConical, statField: "totalAcab" },
  { key: "aprovadas", label: "Aprovadas", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50", icon: ThumbsUp, statField: "totalAprovadas" },
  { key: "reprovadas", label: "Reprovadas", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/50", icon: ThumbsDown, statField: "totalReprovadas" },
]

const SUB_CARDS = [
  { key: "pendentes-cru", label: "Pendentes Tecido Cru", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/50", statField: "pendentesCru" },
  { key: "pendentes-acab", label: "Pendentes Acabamento", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/50", statField: "pendentesAcab" },
  { key: "aprovadas-cru", label: "Aprovadas Cru", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50", statField: "aprovadasCru" },
  { key: "aprovadas-acab", label: "Aprovadas Acabamento", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50", statField: "aprovadasAcab" },
]

export default function DashboardAmostras() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [modalFiltro, setModalFiltro] = useState<string | null>(null)
  const [modalLista, setModalLista] = useState<any[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  const [modalTitle, setModalTitle] = useState("")

  useEffect(() => {
    fetch("/api/dashboard/amostras-stats")
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
      const res = await fetch(`/api/dashboard/amostras-lista?filtro=${filtro}`)
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Dashboard de Amostras{info && <InfoButton content={info} />}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Acompanhe todas as amostras do sistema
        </p>
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
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                  <stat.icon size={16} className="text-slate-400 dark:text-slate-500" />
                </div>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stats?.[stat.statField] ?? 0}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {SUB_CARDS.map((stat) => (
              <button
                key={stat.key}
                type="button"
                onClick={() => openModal(stat.key, stat.label)}
                className={`rounded-xl border border-slate-200 dark:border-slate-800 ${stat.bg} p-3 card-hover text-left w-full cursor-pointer transition-shadow hover:shadow-md`}
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stats?.[stat.statField] ?? 0}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Distribuição por Status</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={(stats?.statusDistribution || []).map((s: any) => ({
                      name: STATUS_LABELS[s.status] || s.status,
                      value: s.total,
                    }))}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                    dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}
                  >
                    {(stats?.statusDistribution || []).map((s: any) => (
                      <Cell key={s.status} fill={STATUS_COLORS[s.status] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Amostras por Tipo</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(stats?.tipoDistribution || []).map((s: any) => ({
                  name: TIPO_LABELS[s.tipo] || s.tipo,
                  total: s.total,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip formatter={(value: any) => `${value || 0} amostras`} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {(stats?.tipoDistribution || []).map((s: any) => (
                      <Cell key={s.tipo} fill={TIPO_CHART_COLORS[s.tipo] || "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Amostras por Mês</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip formatter={(value: any) => `${value || 0} amostras`} />
                  <Line type="monotone" dataKey="total" stroke={TREND_COLOR} strokeWidth={2} dot={{ fill: TREND_COLOR, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Amostras Recentes</h2>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              {!stats?.recent || stats.recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma amostra recente</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">As amostras aparecerão aqui</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Produto</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">ID Integração</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Solicitação</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Descrição</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Tipo</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Status</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((a: any, i: number) => (
                      <tr key={`${a.tipoAmostra}-${a.id}-${i}`} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4 text-sm">
                          <Link href={`/cadastros/produto-cru/${a.produtoId}#amostras`} className="flex items-center gap-1.5 group">
                            <div>
                              <span className="text-xs text-slate-400">{a.produtoCodigo}</span>
                              <p className="text-xs text-slate-500 mt-0.5">{a.produtoDescricao}</p>
                            </div>
                            <ExternalLink size={12} className="text-slate-300 group-hover:text-blue-500 shrink-0" />
                          </Link>
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                          {a.idIntegracao ? (
                            <span className="font-mono text-xs">{a.idIntegracao}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-4 text-sm">
                          {a.solicitacaoId ? (
                            <Link href={`/comercial/solicitacoes/${a.solicitacaoId}`} className="text-blue-600 dark:text-blue-400 hover:underline text-xs">
                              {a.solicitacaoCliente || `#${a.solicitacaoId}`}{a.solicitacaoProjeto ? ` — ${a.solicitacaoProjeto}` : ""}
                            </Link>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{a.descricao || "—"}</td>
                        <td className="p-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_BG[a.tipoAmostra] || "bg-slate-100 text-slate-600"}`}>
                            {TIPO_LABELS[a.tipoAmostra] || a.tipoAmostra}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BG[a.status] || "bg-slate-100 text-slate-600"}`}>
                            {STATUS_LABELS[a.status] || a.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                          {a.data ? new Date(a.data).toLocaleDateString("pt-BR") : "—"}
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
                      key={`${item.tipoAmostra}-${item.id}-${i}`}
                      type="button"
                      onClick={() => { router.push(`/cadastros/produto-cru/${item.produtoId}#amostras`); setModalFiltro(null) }}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                          {item.produtoCodigo || `#${item.produtoId}`} — {item.descricao || "Sem descrição"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{item.produtoDescricao}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-3 shrink-0">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_BG[item.tipoAmostra] || "bg-slate-100 text-slate-600"}`}>
                          {TIPO_LABELS[item.tipoAmostra] || item.tipoAmostra}
                        </span>
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
