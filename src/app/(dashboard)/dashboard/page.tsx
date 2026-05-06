"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { FileText, PlusCircle, BarChart3, Clock } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(" ")[0] || "Usuário"
  const role = session?.user?.role

  const [stats, setStats] = useState({ totalEsteMes: 0, pendentes: 0, emAnalise: 0, concluidas: 0 })
  const [atividades, setAtividades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, atividadesRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/atividades"),
        ])
        const statsData = await statsRes.json()
        const atividadesData = await atividadesRes.json()
        setStats(statsData)
        setAtividades(atividadesData)
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

  const statusLabels: Record<string, string> = {
    PENDENTE: "Pendente",
    EM_ANALISE: "Em Análise",
    AGUARDANDO_INFO: "Aguard. Info",
    CONCLUIDO: "Concluído",
  }

  const tipoLabels: Record<string, string> = {
    DESENVOLVIMENTO_TECELAGEM: "Tecelagem",
    DESENVOLVIMENTO_BENEFICIAMENTO: "Beneficiamento",
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
            {dateStr}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          <div className="col-span-4 text-center py-4 text-slate-500">Carregando...</div>
        ) : (
        [
          { label: "Total este mês", value: stats.totalEsteMes, color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-100 dark:bg-slate-800" },
          { label: "Pendentes", value: stats.pendentes, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50" },
          { label: "Em Análise", value: stats.emAnalise, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/50" },
          { label: "Concluídas", value: stats.concluidas, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border border-slate-200 dark:border-slate-800 ${stat.bg} p-4 card-hover`}>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))
        )}
      </div>

      {/* Quick actions */}
      {(role === "COMERCIAL" || role === "ADMIN") && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Ações Rápidas</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/comercial/solicitacoes/nova"
              className="group flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 card-hover hover:border-blue-300 dark:hover:border-blue-700 transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <PlusCircle size={24} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Nova Solicitação</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Criar novo briefing</p>
              </div>
            </Link>

            <Link
              href="/comercial/solicitacoes"
              className="group flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 card-hover hover:border-purple-300 dark:hover:border-purple-700 transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Ver Solicitações</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Todas as solicitações</p>
              </div>
            </Link>

            <div className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 opacity-60 cursor-not-allowed">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                <BarChart3 size={24} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Relatórios</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Em breve</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Atividades Recentes</h2>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-slate-500">Carregando...</p>
            </div>
          ) : atividades.length === 0 ? (
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
                {atividades.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4 text-sm font-medium">#{item.id}</td>
                    <td className="p-4 text-sm">{tipoLabels[item.tipo] || item.tipo}</td>
                    <td className="p-4 text-sm">{item.cliente}</td>
                    <td className="p-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.status === "PENDENTE" ? "bg-amber-100 text-amber-700" :
                        item.status === "EM_ANALISE" ? "bg-blue-100 text-blue-700" :
                        item.status === "CONCLUIDO" ? "bg-green-100 text-green-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {statusLabels[item.status] || item.status}
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
    </div>
  )
}
