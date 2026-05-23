"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { FileText, PlusCircle, Clock, Package } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: "#f59e0b",
  EM_DESENVOLVIMENTO: "#6366f1",
  AGUARDANDO_INFO: "#ea580c",
  APROVADO: "#14b8a6",
  REPROVADO: "#ef4444",
  EM_PRODUCAO: "#a855f7",
  CONCLUIDO: "#22c55e",
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_DESENVOLVIMENTO: "Em Desenvolvimento",
  AGUARDANDO_INFO: "Aguard. Info",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
  EM_PRODUCAO: "Em Produção",
  CONCLUIDO: "Concluído",
}

const TIPO_LABELS: Record<string, string> = {
  DESENVOLVIMENTO_TECELAGEM: "Tecelagem",
  DESENVOLVIMENTO_BENEFICIAMENTO: "Beneficiamento",
}

const TIPO_COLORS: Record<string, string> = {
  DESENVOLVIMENTO_TECELAGEM: "#06b6d4",
  DESENVOLVIMENTO_BENEFICIAMENTO: "#f97316",
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(" ")[0] || "Usuário"

  const [stats, setStats] = useState<any>(null)
  const [atividades, setAtividades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, atividadesRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/atividades"),
        ])
        if (statsRes.ok) setStats(await statsRes.json())
        if (atividadesRes.ok) setAtividades(await atividadesRes.json())
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const now = new Date()
  const dateStr = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const pathname = usePathname()
  const info = getInfoContent(pathname)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Dashboard Solicitações
            {info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
            Olá, {firstName}! — {dateStr}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Carregando...</div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {[
              { label: "Total este mês", value: stats?.totalEsteMes ?? 0, color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-100 dark:bg-slate-800" },
              { label: "Pendentes", value: stats?.pendentes ?? 0, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50" },
              { label: "Em Desenvolvimento", value: stats?.emDesenvolvimento ?? 0, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/50" },
              { label: "Concluídas", value: stats?.concluidas ?? 0, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50" },
              { label: "Produtos CAD", value: stats?.totalProdutosCru ?? 0, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/50" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl border border-slate-200 dark:border-slate-800 ${stat.bg} p-4 card-hover`}>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly trend */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Solicitações por Mês</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={stats?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip formatter={(value: any) => `${value || 0} solicitações`} />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Status distribution */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Distribuição por Status</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={(stats?.statusDistribution || []).map((s: any) => ({
                      name: STATUS_LABELS[s.status] || s.status,
                      value: s.total,
                    }))}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                    dataKey="value" label={({ name, value }) => `${name}: ${value}`}
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
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Solicitações por Tipo</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(stats?.tipoDistribution || []).map((s: any) => ({
                  name: TIPO_LABELS[s.tipo] || s.tipo,
                  total: s.total,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip formatter={(value: any) => `${value || 0} solicitações`} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {(stats?.tipoDistribution || []).map((s: any) => (
                      <Cell key={s.tipo} fill={TIPO_COLORS[s.tipo] || "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick actions */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Ações Rápidas</h3>
                <div className="grid grid-cols-1 gap-3">
                  <Link href="/comercial/solicitacoes/nova"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                      <PlusCircle size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-800 dark:text-slate-100">Nova Solicitação</p>
                      <p className="text-xs text-slate-500">Criar novo briefing</p>
                    </div>
                  </Link>
                  <Link href="/comercial/solicitacoes"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-800 dark:text-slate-100">Ver Solicitações</p>
                      <p className="text-xs text-slate-500">Todas as solicitações</p>
                    </div>
                  </Link>
                  <Link href="/cadastros/produto-cru"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-400">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-800 dark:text-slate-100">Produtos Cru</p>
                      <p className="text-xs text-slate-500">Gerenciar fichas técnicas</p>
                    </div>
                  </Link>
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Atividades Recentes</h2>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              {atividades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma atividade recente</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">As solicitações criadas aparecerão aqui</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">ID</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Tipo</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Cliente</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Status</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atividades.map((item, i) => (
                      <tr key={item.id || i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4 text-sm font-medium">#{item.id}</td>
                        <td className="p-4 text-sm">{TIPO_LABELS[item.tipo] || item.tipo}</td>
                        <td className="p-4 text-sm">{item.cliente}</td>
                        <td className="p-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            item.status === "PENDENTE" ? "bg-amber-100 text-amber-700" :
                            item.status === "EM_DESENVOLVIMENTO" ? "bg-indigo-100 text-indigo-700" :
                            item.status === "APROVADO" ? "bg-teal-100 text-teal-700" :
                            item.status === "REPROVADO" ? "bg-red-100 text-red-700" :
                            item.status === "CONCLUIDO" ? "bg-green-100 text-green-700" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {STATUS_LABELS[item.status] || item.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : "—"}
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
