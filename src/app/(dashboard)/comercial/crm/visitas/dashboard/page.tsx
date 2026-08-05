"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useState, useCallback } from "react"
import {
  Calendar, CheckCircle2, XCircle, Clock, MapPin, Users,
  ArrowRight, BarChart3, PieChart as PieChartIcon, ClipboardCheck, Navigation, User, X, Loader2,
} from "lucide-react"
import VisitLocationModal from "@/components/crm/visit-location-modal"
import { useEscapeClose } from "@/lib/use-escape-close"

const VisitasCharts = dynamic(() => import("./charts").then((m) => m.VisitasCharts), { ssr: false })

type VisitasDashboardData = {
  total: number
  realizadas: number
  canceladas: number
  agendadas: number
  hoje: number
  esteMes: number
  byTipo: { tipo: string; total: number }[]
  byStatus: { status: string; total: number }[]
  porRepresentante: { representanteId: number | null; representanteNome: string; total: number }[]
  ultimasVisitas: { id: number; empresaId: number; clienteId: number | null; dataVisita: string; hora: string | null; tipo: string; status: string; endereco: string | null; numero: string | null; complemento: string | null; bairro: string | null; cidade: string | null; uf: string | null }[]
  pesquisas: { enviadas: number; abertas: number; respondidas: number }
}

const STATUS_LABELS: Record<string, string> = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em Andamento",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
}

const TIPO_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  VIDEO: "Vídeo",
  TELEFONE: "Telefone",
}

const FILTROS_LABELS: Record<string, string> = {
  total: "Total de Visitas",
  realizadas: "Visitas Realizadas",
  canceladas: "Visitas Canceladas",
  agendadas: "Visitas Agendadas",
  hoje: "Visitas de Hoje",
  "este-mes": "Visitas deste Mês",
  "pesquisas-respondidas": "Visitas com Pesquisa Respondida",
  "tipo-PRESENCIAL": "Visitas Presenciais",
  "tipo-VIDEO": "Visitas por Vídeo",
  "tipo-TELEFONE": "Visitas por Telefone",
  "status-EM_ANDAMENTO": "Visitas Em Andamento",
}

export default function VisitasDashboardPage() {
  const [selectedVisita, setSelectedVisita] = useState<{ id: number; nome: string } | null>(null)
  const [modalFiltro, setModalFiltro] = useState<string | null>(null)
  const [modalTitle, setModalTitle] = useState("")
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role
  const isComercial = userRole && !["ADMIN", "SUDO", "CRM"].includes(userRole)
  const [visitasFilter, setVisitasFilter] = useState<"todas" | "minhas">(
    isComercial ? "minhas" : "todas"
  )

  useEscapeClose(!!modalFiltro, () => setModalFiltro(null))

  const { data, isLoading } = useQuery<VisitasDashboardData>({
    queryKey: ["visitas-dashboard", visitasFilter],
    queryFn: () => fetch(`/api/crm/visitas/dashboard${visitasFilter === "minhas" ? "?mine=true" : ""}`).then((r: any) => r.json()),
    retry: 1,
  })

  const modalQuery = useQuery({
    queryKey: ["visitas-dashboard-lista", modalFiltro, visitasFilter],
    queryFn: async () => {
      const res = await fetch(`/api/crm/visitas/dashboard-lista?filtro=${modalFiltro}${visitasFilter === "minhas" ? "&mine=true" : ""}`)
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
    enabled: !!modalFiltro,
    retry: 1,
  })

  const openModal = useCallback((filtro: string) => {
    setModalTitle(FILTROS_LABELS[filtro] || filtro)
    setModalFiltro(filtro)
  }, [])

  const modalLista = modalQuery.data ?? []
  const modalLoading = modalQuery.isFetching

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Dashboard de Visitas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Métricas de visitas comerciais, check-in e performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 shadow-sm">
            <button
              onClick={() => setVisitasFilter("todas")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                visitasFilter === "todas"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Users size={14} />
              Todas
            </button>
            <button
              onClick={() => setVisitasFilter("minhas")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                visitasFilter === "minhas"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <User size={14} />
              Minhas Visitas
            </button>
          </div>
          <Link
            href="/comercial/crm/visitas"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            Ver todas <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* Linha 1: Cards de resumo */}
           <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <SummaryCard
              onClick={() => openModal("total")}
              icon={<Calendar size={20} />}
              value={data?.total ?? 0}
              label="Total Visitas"
              bgColor="bg-blue-100 dark:bg-blue-950/50"
              iconColor="text-blue-600 dark:text-blue-400"
            />
            <SummaryCard
              onClick={() => openModal("realizadas")}
              icon={<CheckCircle2 size={20} />}
              value={data?.realizadas ?? 0}
              label="Realizadas"
              bgColor="bg-green-100 dark:bg-green-950/50"
              iconColor="text-green-600 dark:text-green-400"
            />
            <SummaryCard
              onClick={() => openModal("canceladas")}
              icon={<XCircle size={20} />}
              value={data?.canceladas ?? 0}
              label="Canceladas"
              bgColor="bg-red-100 dark:bg-red-950/50"
              iconColor="text-red-600 dark:text-red-400"
            />
            <SummaryCard
              onClick={() => openModal("agendadas")}
              icon={<Clock size={20} />}
              value={data?.agendadas ?? 0}
              label="Agendadas"
              bgColor="bg-indigo-100 dark:bg-indigo-950/50"
              iconColor="text-indigo-600 dark:text-indigo-400"
            />
            <SummaryCard
              onClick={() => openModal("hoje")}
              icon={<MapPin size={20} />}
              value={data?.hoje ?? 0}
              label="Visitas Hoje"
              bgColor="bg-amber-100 dark:bg-amber-950/50"
              iconColor="text-amber-600 dark:text-amber-400"
            />
            <SummaryCard
              onClick={() => openModal("este-mes")}
              icon={<Calendar size={20} />}
              value={data?.esteMes ?? 0}
              label="Este Mes"
              bgColor="bg-teal-100 dark:bg-teal-950/50"
              iconColor="text-teal-600 dark:text-teal-400"
            />
            <SummaryCard
              onClick={() => openModal("pesquisas-respondidas")}
              icon={<ClipboardCheck size={20} />}
              value={data?.pesquisas?.respondidas ?? 0}
              label="Pesquisas Respondidas"
              sub={`${data?.pesquisas?.abertas ?? 0} abertas`}
              bgColor="bg-violet-100 dark:bg-violet-950/50"
              iconColor="text-violet-600 dark:text-violet-400"
            />
          </div>

          {/* Linha 2: Graficos */}
          <VisitasCharts data={data} openModal={openModal} />

          {/* Linha 3: Performance por Representante */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                Performance por Representante
              </h2>
              <Link href="/comercial/crm/visitas" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>
            {data?.porRepresentante && data.porRepresentante.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.porRepresentante.map((rep: any, i: any) => (
                  <div key={rep.representanteId ?? i} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-slate-400 w-5">{i + 1}.</span>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {rep.representanteNome}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {rep.total} visitas
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm text-slate-400">Nenhuma visita registrada</p>
              </div>
            )}
          </div>

          {/* Linha 4: —altimas Visitas */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Calendar size={16} className="text-amber-500" />
                —altimas Visitas
              </h2>
              <Link href="/comercial/crm/visitas" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>
            {data?.ultimasVisitas && data.ultimasVisitas.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.ultimasVisitas.map((visita: any) => (
                  <div key={visita.id} className="flex items-center justify-between gap-2 p-3">
                    <div className="flex items-center gap-2 min-w-0 shrink">
                      <Link
                        href={`/comercial/crm/visitas/${visita.id}`}
                        className="text-xs md:text-sm font-medium text-slate-900 dark:text-slate-100 truncate hover:underline whitespace-nowrap"
                      >
                        Visita #{visita.id}
                      </Link>
                      <span className="text-[10px] md:text-xs text-slate-500 whitespace-nowrap">
                        {visita.dataVisita
                          ? new Date(visita.dataVisita + "T12:00:00").toLocaleDateString("pt-BR")
                          : "—"}{visita.hora ? ` ${visita.hora}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 shrink-0">
                      <span className={`text-[10px] px-1.5 md:px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                        visita.status === "REALIZADA"
                          ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                          : visita.status === "CANCELADA"
                          ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                      }`}>
                        {visita.status}
                      </span>
                      {(visita.endereco || visita.cidade) && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([visita.endereco, visita.numero, visita.complemento, visita.bairro, visita.cidade, visita.uf].filter(Boolean).join(", "))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 md:p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                          title="Abrir no Google Maps"
                        >
                          <Navigation size={12} className="text-emerald-500 md:text-emerald-500" />
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedVisita({ id: visita.id, nome: `Visita #${visita.id}` })}
                        className="p-2 md:p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                        title="Gerenciar localizações"
                      >
                        <MapPin size={12} className="text-blue-500 md:text-blue-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm text-slate-400">Nenhuma visita registrada</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Ações Rápidas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickAction href="/comercial/crm/visitas/novo" icon={<Calendar size={18} />} label="Nova Visita" color="text-amber-600" bg="bg-amber-100 dark:bg-amber-950/50" />
              <QuickAction href="/comercial/crm/visitas" icon={<BarChart3 size={18} />} label="Listar Visitas" color="text-blue-600" bg="bg-blue-100 dark:bg-blue-950/50" />
              <QuickAction href="/comercial/crm/visitas?view=kanban" icon={<PieChartIcon size={18} />} label="Kanban Visitas" color="text-indigo-600" bg="bg-indigo-100 dark:bg-indigo-950/50" />
              <QuickAction href="/comercial/crm/visitas/dashboard" icon={<CheckCircle2 size={18} />} label="Dashboard" color="text-green-600" bg="bg-green-100 dark:bg-green-950/50" />
            </div>
          </div>
        </>
      )}

      {selectedVisita && (
        <VisitLocationModal
          visitaId={selectedVisita.id}
          empresaNome={selectedVisita.nome}
          open={!!selectedVisita}
          onClose={() => setSelectedVisita(null)}
        />
      )}

      {modalFiltro && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 bg-black/50" onClick={() => setModalFiltro(null)} role="dialog" aria-modal="true" aria-label={modalTitle}>
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[75vh] flex flex-col border border-slate-200 dark:border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{modalTitle}</h2>
              <button type="button" onClick={() => setModalFiltro(null)} aria-label="Fechar" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex-1">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                </div>
              ) : modalLista.length === 0 ? (
                <p className="text-center text-slate-500 py-12">Nenhuma visita encontrada</p>
              ) : (
                <div className="space-y-1">
                  {modalLista.map((v: any) => (
                    <Link
                      key={v.id}
                      href={`/comercial/crm/visitas/${v.id}`}
                      onClick={() => setModalFiltro(null)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                          {v.empresaNome || v.clienteNome || v.nomeAvulso || `Visita #${v.id}`}
                        </p>
                        <p className="text-xs text-slate-400">
                          {v.dataVisita
                            ? new Date(v.dataVisita + "T12:00:00").toLocaleDateString("pt-BR")
                            : ""}
                          {v.hora ? ` ${v.hora}` : ""}
                          {` · ${TIPO_LABELS[v.tipo] || v.tipo}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-3 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                          v.status === "REALIZADA"
                            ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                            : v.status === "CANCELADA"
                            ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                            : v.status === "EM_ANDAMENTO"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                        }`}>
                          {STATUS_LABELS[v.status] || v.status}
                        </span>
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

function SummaryCard({
  onClick, icon, value, label, sub, bgColor, iconColor,
}: {
  onClick: () => void; icon: React.ReactNode; value: number; label: string; sub?: string; bgColor: string; iconColor: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-shadow text-left w-full"
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-lg ${bgColor} p-2.5`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
      {sub && <p className="text-[10px] text-slate-400 mt-1.5">{sub}</p>}
    </button>
  )
}

function QuickAction({
  href, icon, label, color, bg,
}: {
  href: string; icon: React.ReactNode; label: string; color: string; bg: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
    >
      <div className={`rounded-lg ${bg} p-2`}>
        <span className={color}>{icon}</span>
      </div>
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </Link>
  )
}
