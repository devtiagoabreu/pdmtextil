"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { FileText, PlusCircle, Clock, Package, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Button } from "@/components/ui/button"
import { useStatuses, hexToRgba } from "@/hooks/use-statuses"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const TIPO_LABELS: Record<string, string> = {
  DESENVOLVIMENTO_TECELAGEM: "Tecelagem",
  DESENVOLVIMENTO_BENEFICIAMENTO: "Beneficiamento",
}

const PRODUTO_STATUS_LABELS: Record<string, string> = {
  DESENVOLVIMENTO: "Em Desenvolvimento",
  APROVADO: "Aprovado",
  EM_PRODUCAO: "Em Produção",
  OBSOLETO: "Obsoleto",
}

const TIPO_COLORS: Record<string, string> = {
  DESENVOLVIMENTO_TECELAGEM: "#06b6d4",
  DESENVOLVIMENTO_BENEFICIAMENTO: "#f97316",
}

const FILTROS_DASH = [
              { key: "total-mes", label: "Total", icon: "solicitacao" },
  { key: "pendentes", label: "Pendentes", icon: "solicitacao" },
  { key: "em-desenvolvimento", label: "Em Desenvolvimento", icon: "solicitacao" },
  { key: "concluidas", label: "Concluídas", icon: "solicitacao" },
  { key: "produtos-cru", label: "Produtos CAD", icon: "produto" },
] as const

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(" ")[0] || "Usuário"

  const [stats, setStats] = useState<any>(null)
  const [atividades, setAtividades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const { getLabel: getStatusLabel, getColor: getStatusColor } = useStatuses("SOLICITACAO_DESENVOLVIMENTO")

  const [modalFiltro, setModalFiltro] = useState<string | null>(null)
  const [modalLista, setModalLista] = useState<any[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  const [modalTitle, setModalTitle] = useState("")

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

  const openModal = useCallback(async (filtro: string) => {
    const filtroDef = FILTROS_DASH.find(f => f.key === filtro)
    setModalTitle(filtroDef?.label || filtro)
    setModalFiltro(filtro)
    setModalLoading(true)
    setModalLista([])
    try {
      const res = await fetch(`/api/dashboard/solicitacoes-lista?filtro=${filtro}`)
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
              { key: "total-mes", label: "Total este mês", value: stats?.totalEsteMes ?? 0, color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-100 dark:bg-slate-800" },
              { key: "pendentes", label: "Pendentes", value: stats?.pendentes ?? 0, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50" },
              { key: "em-desenvolvimento", label: "Em Desenvolvimento", value: stats?.emDesenvolvimento ?? 0, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/50" },
              { key: "concluidas", label: "Concluídas", value: stats?.concluidas ?? 0, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50" },
              { key: "produtos-cru", label: "Produtos CAD", value: stats?.totalProdutosCru ?? 0, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/50" },
            ].map((stat) => (
              <button
                key={stat.key}
                type="button"
                onClick={() => openModal(stat.key)}
                className={`rounded-xl border border-slate-200 dark:border-slate-800 ${stat.bg} p-4 card-hover text-left w-full cursor-pointer transition-shadow hover:shadow-md`}
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </button>
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
                      name: getStatusLabel(s.status),
                      value: s.total,
                      fill: getStatusColor(s.status),
                    }))}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    isAnimationActive={false}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {(stats?.statusDistribution || []).map((s: any) => {
                  const map: Record<string, string> = {
                    PENDENTE: "pendentes",
                    EM_DESENVOLVIMENTO: "em-desenvolvimento",
                    PILOTAGEM: "em-desenvolvimento",
                    CONCLUIDO_DEV: "concluidas",
                    APROVADO_CLI: "concluidas",
                    CONCLUIDO: "concluidas",
                  }
                  return (
                    <button
                      key={s.status}
                      type="button"
                      onClick={() => openModal(map[s.status] || "pendentes")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity border border-slate-200 dark:border-slate-700"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getStatusColor(s.status) }} />
                      {getStatusLabel(s.status)}: {s.total}
                    </button>
                  )
                })}
              </div>
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
                      <tr
                        key={item.id || i}
                        onClick={() => { if (item.id) router.push(`/comercial/solicitacoes/${item.id}`) }}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="p-4 text-sm font-medium">#{item.id}</td>
                        <td className="p-4 text-sm">{TIPO_LABELS[item.tipo] || item.tipo}</td>
                        <td className="p-4 text-sm">{item.cliente}</td>
                        <td className="p-4 text-sm">
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium" style={{
                            backgroundColor: hexToRgba(getStatusColor(item.status), 0.15),
                            color: getStatusColor(item.status),
                          }}>
                            {getStatusLabel(item.status)}
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
              ) : modalFiltro === "produtos-cru" ? (
                <div className="space-y-1">
                  {modalLista.map((item: any) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { router.push(`/cadastros/produto-cru/${item.id}`); setModalFiltro(null) }}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                          {item.codigoPdm} — {item.descricao}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-3 shrink-0">
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${PRODUTO_STATUS_LABELS[item.status] ? "bg-slate-100 dark:bg-slate-800 text-slate-600" : ""}`}>
                          {PRODUTO_STATUS_LABELS[item.status] || item.status}
                        </span>
                        <span className="text-xs text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : ""}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {modalLista.map((item: any) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { router.push(`/comercial/solicitacoes/${item.id}`); setModalFiltro(null) }}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                          #{item.id} — {item.cliente}{item.projeto ? ` (${item.projeto})` : ""}
                        </p>
                        <p className="text-xs text-slate-400">{TIPO_LABELS[item.tipo] || item.tipo}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-3 shrink-0">
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium" style={{
                          backgroundColor: hexToRgba(getStatusColor(item.status), 0.15),
                          color: getStatusColor(item.status),
                        }}>
                          {getStatusLabel(item.status)}
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
