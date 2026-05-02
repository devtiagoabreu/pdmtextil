import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { FileText, PlusCircle, BarChart3, Clock } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const firstName = session?.user?.name?.split(" ")[0] || "Usuário"
  const role = session?.user?.role

  const now = new Date()
  const dateStr = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

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
        {[
          { label: "Total este mês", value: "0", color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-100 dark:bg-slate-800" },
          { label: "Pendentes", value: "0", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50" },
          { label: "Em Análise", value: "0", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/50" },
          { label: "Concluídas", value: "0", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border border-slate-200 dark:border-slate-800 ${stat.bg} p-4 card-hover`}>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
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

            <div className="group flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 opacity-60 cursor-not-allowed">
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

      {/* Recent activity placeholder */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Atividades Recentes</h2>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma atividade recente</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">As solicitações criadas aparecerão aqui</p>
          </div>
        </div>
      </div>
    </div>
  )
}
