"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import {
  Calendar, CheckCircle2, XCircle, Clock, MapPin, Users,
  ArrowRight, BarChart3, PieChart as PieChartIcon, ClipboardCheck, Navigation,
} from "lucide-react"
import {
  BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { ChartTooltip } from "@/components/ui/chart-tooltip"
import { AnimatedLine } from "@/components/ui/animated-line"
import VisitLocationModal from "@/components/crm/visit-location-modal"

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
  ultimasVisitas: { id: number; empresaId: number; clienteId: number | null; dataVisita: string; tipo: string; status: string; endereco: string | null; numero: string | null; complemento: string | null; bairro: string | null; cidade: string | null; uf: string | null }[]
  pesquisas: { enviadas: number; abertas: number; respondidas: number }
}

const TIPO_CORES: Record<string, string> = {
  PRESENCIAL: "#6366f1",
  VIDEO: "#06b6d4",
  TELEFONE: "#f97316",
}

const STATUS_CORES: Record<string, string> = {
  AGENDADA: "#6366f1",
  EM_ANDAMENTO: "#f97316",
  REALIZADA: "#22c55e",
  CANCELADA: "#ef4444",
}

const STATUS_LABELS: Record<string, string> = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em Andamento",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
}

const TIPO_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  VIDEO: "Video",
  TELEFONE: "Telefone",
}

const CHART_COLORS = ["#6366f1", "#06b6d4", "#f97316", "#22c55e", "#ef4444", "#8b5cf6"]

export default function VisitasDashboardPage() {
  const [selectedVisita, setSelectedVisita] = useState<{ id: number; nome: string } | null>(null)
  const { data, isLoading } = useQuery<VisitasDashboardData>({
    queryKey: ["visitas-dashboard"],
    queryFn: () => fetch("/api/crm/visitas/dashboard").then((r) => r.json()),
    retry: 1,
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Dashboard de Visitas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Métricas de visitas comerciais, check-in e performance
          </p>
        </div>
        <Link
          href="/comercial/crm/visitas"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          Ver todas <ArrowRight size={14} />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* Linha 1: Cards de resumo */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <SummaryCard
              href="/comercial/crm/visitas"
              icon={<Calendar size={20} />}
              value={data?.total ?? 0}
              label="Total Visitas"
              bgColor="bg-blue-100 dark:bg-blue-950/50"
              iconColor="text-blue-600 dark:text-blue-400"
            />
            <SummaryCard
              href="/comercial/crm/visitas"
              icon={<CheckCircle2 size={20} />}
              value={data?.realizadas ?? 0}
              label="Realizadas"
              bgColor="bg-green-100 dark:bg-green-950/50"
              iconColor="text-green-600 dark:text-green-400"
            />
            <SummaryCard
              href="/comercial/crm/visitas"
              icon={<XCircle size={20} />}
              value={data?.canceladas ?? 0}
              label="Canceladas"
              bgColor="bg-red-100 dark:bg-red-950/50"
              iconColor="text-red-600 dark:text-red-400"
            />
            <SummaryCard
              href="/comercial/crm/visitas"
              icon={<Clock size={20} />}
              value={data?.agendadas ?? 0}
              label="Agendadas"
              bgColor="bg-indigo-100 dark:bg-indigo-950/50"
              iconColor="text-indigo-600 dark:text-indigo-400"
            />
            <SummaryCard
              href="/comercial/crm/visitas"
              icon={<MapPin size={20} />}
              value={data?.hoje ?? 0}
              label="Visitas Hoje"
              bgColor="bg-amber-100 dark:bg-amber-950/50"
              iconColor="text-amber-600 dark:text-amber-400"
            />
            <SummaryCard
              href="/comercial/crm/visitas"
              icon={<Calendar size={20} />}
              value={data?.esteMes ?? 0}
              label="Este Mes"
              bgColor="bg-teal-100 dark:bg-teal-950/50"
              iconColor="text-teal-600 dark:text-teal-400"
            />
            <SummaryCard
              href="/comercial/crm/visitas"
              icon={<ClipboardCheck size={20} />}
              value={data?.pesquisas?.respondidas ?? 0}
              label="Pesquisas Respondidas"
              sub={`${data?.pesquisas?.abertas ?? 0} abertas`}
              bgColor="bg-violet-100 dark:bg-violet-950/50"
              iconColor="text-violet-600 dark:text-violet-400"
            />
          </div>

          {/* Linha 2: Graficos */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Visitas por Tipo (Pizza) */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon size={16} className="text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Visitas por Tipo</h2>
              </div>
              {data?.byTipo && data.byTipo.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <RPieChart>
                      <Pie
                        data={data.byTipo.map((t) => ({
                          name: TIPO_LABELS[t.tipo] || t.tipo,
                          value: t.total,
                          fill: TIPO_CORES[t.tipo] || "#6366f1",
                        }))}
                        cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        animationDuration={2500}
                        animationEasing="ease-in-out"
                        animationBegin={800}
                      />
                      <Tooltip content={<ChartTooltip />} />
                    </RPieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {data.byTipo.map((t) => (
                      <span
                        key={t.tipo}
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: TIPO_CORES[t.tipo] || "#6366f1" }}
                        />
                        {TIPO_LABELS[t.tipo] || t.tipo}: {t.total}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">Nenhuma visita registrada</p>
              )}
            </div>

            {/* Visitas por Status (Barra) */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Visitas por Status</h2>
              </div>
              {data?.byStatus && data.byStatus.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={data.byStatus.map((s) => ({
                        name: STATUS_LABELS[s.status] || s.status,
                        value: s.total,
                      }))}
                      margin={{ left: 10, right: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip content={<ChartTooltip formatter={(v) => `${v} visitas`} />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={1800} animationEasing="ease-in-out" animationBegin={800}>
                        {data.byStatus.map((s, i) => (
                          <Cell key={i} fill={STATUS_CORES[s.status] || CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                    {data.byStatus.map((s, i) => (
                      <span
                        key={s.status}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: STATUS_CORES[s.status] || CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        {STATUS_LABELS[s.status] || s.status}: {s.total}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">Nenhuma visita registrada</p>
              )}
            </div>
          </div>

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
                {data.porRepresentante.map((rep, i) => (
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

          {/* Linha 4: Últimas Visitas */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Calendar size={16} className="text-amber-500" />
                Últimas Visitas
              </h2>
              <Link href="/comercial/crm/visitas" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>
            {data?.ultimasVisitas && data.ultimasVisitas.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.ultimasVisitas.map((visita) => (
                  <div key={visita.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Link
                        href={`/comercial/crm/visitas/${visita.id}`}
                        className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate hover:underline"
                      >
                        Visita #{visita.id}
                      </Link>
                      <span className="text-xs text-slate-500">
                        {visita.dataVisita
                          ? new Date(visita.dataVisita + "T12:00:00").toLocaleDateString("pt-BR")
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
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
                          className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                          title="Abrir no Google Maps"
                        >
                          <Navigation size={14} className="text-emerald-500" />
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedVisita({ id: visita.id, nome: `Visita #${visita.id}` })}
                        className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                        title="Gerenciar localizações"
                      >
                        <MapPin size={14} className="text-blue-500" />
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
    </div>
  )
}

function SummaryCard({
  href, icon, value, label, sub, bgColor, iconColor,
}: {
  href: string; icon: React.ReactNode; value: number; label: string; sub?: string; bgColor: string; iconColor: string
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-shadow"
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
    </Link>
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
