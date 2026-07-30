"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Clock, X, Loader2 } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useStatuses, hexToRgba } from "@/hooks/use-statuses"
import { ChartCard } from "@/components/ui/chart-card"
import { AnimatedNumber } from "@/components/ui/animated-number"

const DashboardCharts = dynamic(() => import("./dashboard-charts"), { ssr: false })

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
  { key: "pilotagem", label: "Pilotagem", icon: "solicitacao" },
  { key: "concluido-dev", label: "Concluído Desenvolvimento", icon: "solicitacao" },
  { key: "aprovado-cliente", label: "Aprovado pelo Cliente", icon: "solicitacao" },
  { key: "produtos-cru", label: "Produtos CAD", icon: "produto" },
] as const

export default function DashboardPage() {
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
    const filtroDef = FILTROS_DASH.find((f: any) => f.key === filtro)
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
            Dashboard Solicitações de Desenvolvimento
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-7">
            {[
              { key: "total-mes", label: "Total este mês", value: stats?.totalEsteMes ?? 0, color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-100 dark:bg-slate-800", delay: 0 },
              { key: "pendentes", label: "Pendentes", value: stats?.pendentes ?? 0, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50", delay: 50 },
              { key: "em-desenvolvimento", label: "Em Desenvolvimento", value: stats?.emDesenvolvimento ?? 0, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/50", delay: 100 },
              { key: "pilotagem", label: "Pilotagem", value: stats?.pilotagem ?? 0, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/50", delay: 150 },
              { key: "concluido-dev", label: "Concluído Desenvolvimento", value: stats?.concluidoDev ?? 0, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/50", delay: 200 },
              { key: "aprovado-cliente", label: "Aprovado pelo Cliente", value: stats?.aprovadoCliente ?? 0, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/50", delay: 250 },
              { key: "produtos-cru", label: "Produtos CAD", value: stats?.totalProdutosCru ?? 0, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/50", delay: 300 },
            ].map((stat: any) => (
              <button
                key={stat.key}
                type="button"
                onClick={() => openModal(stat.key)}
                className={`rounded-xl border border-slate-200 dark:border-slate-800 ${stat.bg} p-4 card-hover text-left w-full cursor-pointer transition-shadow hover:shadow-md`}
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>
                  <AnimatedNumber value={stat.value} delay={stat.delay} duration={1500} />
                </p>
              </button>
            ))}
          </div>

          <DashboardCharts
            stats={stats}
            getStatusLabel={getStatusLabel}
            getStatusColor={getStatusColor}
            openModal={openModal}
          />

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
                    {atividades.map((item: any, i: any) => (
                      <tr key={item.id || i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 text-sm font-medium">
                          <Link href={`/comercial/solicitacoes/${item.id}`} className="hover:underline">#{item.id}</Link>
                        </td>
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
                    <Link
                      key={item.id}
                      href={`/cadastros/produto-cru/${item.id}`}
                      onClick={() => setModalFiltro(null)}
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
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {modalLista.map((item: any) => (
                    <Link
                      key={item.id}
                      href={`/comercial/solicitacoes/${item.id}`}
                      onClick={() => setModalFiltro(null)}
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
