"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ClipboardList, FlaskConical, ThumbsUp, ThumbsDown, Clock } from "lucide-react"
import { usePathname } from "next/navigation"
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

const STATUS_BG: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  APROVADO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REPROVADO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export default function DashboardAmostras() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/amostras-stats")
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
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
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {[
              { label: "Total Geral", value: stats?.totalGeral ?? 0, color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-100 dark:bg-slate-800", icon: ClipboardList },
              { label: "Tecido Cru", value: stats?.totalCru ?? 0, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/50", icon: FlaskConical },
              { label: "Acabamento", value: stats?.totalAcab ?? 0, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/50", icon: FlaskConical },
              { label: "Aprovadas", value: stats?.totalAprovadas ?? 0, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50", icon: ThumbsUp },
              { label: "Reprovadas", value: stats?.totalReprovadas ?? 0, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/50", icon: ThumbsDown },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl border border-slate-200 dark:border-slate-800 ${stat.bg} p-4 card-hover`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                  <stat.icon size={16} className="text-slate-400 dark:text-slate-500" />
                </div>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Sub-cards: pendentes por tipo */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Pendentes Tecido Cru", value: stats?.pendentesCru ?? 0, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/50" },
              { label: "Pendentes Acabamento", value: stats?.pendentesAcab ?? 0, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/50" },
              { label: "Aprovadas Cru", value: stats?.aprovadasCru ?? 0, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50" },
              { label: "Aprovadas Acabamento", value: stats?.aprovadasAcab ?? 0, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl border border-slate-200 dark:border-slate-800 ${stat.bg} p-3 card-hover`}>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Status distribution */}
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

            {/* Tipo distribution */}
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

            {/* Monthly trend */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Amostras por Mês</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip formatter={(value: any) => `${value || 0} amostras`} />
                  <Line type="monotone" dataKey="total" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent amostras */}
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
                          <span className="text-xs text-slate-400">{a.produtoCodigo}</span>
                          <p className="text-xs text-slate-500 mt-0.5">{a.produtoDescricao}</p>
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{a.descricao || "—"}</td>
                        <td className="p-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            a.tipoAmostra === "TECIDO_CRU"
                              ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          }`}>
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
    </div>
  )
}
