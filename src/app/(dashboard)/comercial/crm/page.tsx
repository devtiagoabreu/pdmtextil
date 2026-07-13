"use client"

import { useQuery } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import {
  Building2, Users, Target, UserPlus, TrendingUp, Clock, CheckCircle2,
  FileText, Calendar, ArrowRight, Handshake, XCircle, AlertCircle,
  BarChart3, PieChart,
} from "lucide-react"
import {
  LineChart, Line, BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

type CrmDashboardData = {
  leads: { total: number; esteMes: number }
  pessoas: { total: number }
  oportunidades: {
    total: number; esteMes: number
    byStatus: { status: string; total: number }[]
  }
  propostas: {
    total: number
    byStatus: { status: string; total: number }[]
  }
  visitas: { total: number; hoje: number }
  tarefas: { pendentes: number; vencendo: number }
  topEmpresas: { empresaId: number | null; empresaNome: string; totalValor: number }[]
  forecast: number
  conversao: { oportunidadesConvertidas: number; totalOportunidades: number }
  recentes: { id: number; tipo: string; descricao: string; dataEvento: string }[]
  previsaoVendas: { periodo: string; valorPrevisto: number; valorReal: number | null; dados: any }[]
}

const STATUS_CORES: Record<string, string> = {
  NOVO: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  QUALIFICADO: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
  QUALIFICACAO: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
  PROPOSTA: "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400",
  NEGOCIACAO: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
  FECHADO_GANHO: "text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400",
  FECHADO_PERDIDO: "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400",
  CONVERTIDO: "text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400",
  PERDIDO: "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400",
  CONTATADO: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
}

const CHART_COLORS = ["#6366f1", "#06b6d4", "#f97316", "#22c55e", "#ef4444", "#8b5cf6"]
const PIPELINE_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#22c55e", "#ef4444"]

const TIPO_EVENTO_ICON: Record<string, React.ReactNode> = {
  LEAD: <UserPlus size={14} />,
  OPORTUNIDADE: <Target size={14} />,
  VISITA: <Calendar size={14} />,
  TAREFA: <CheckCircle2 size={14} />,
  PROPOSTA: <FileText size={14} />,
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function getTipoCor(tipo: string) {
  const map: Record<string, string> = {
    LEAD: "text-emerald-500",
    OPORTUNIDADE: "text-purple-500",
    VISITA: "text-blue-500",
    TAREFA: "text-amber-500",
    PROPOSTA: "text-cyan-500",
  }
  return map[tipo] || "text-slate-400"
}

function getTipoBg(tipo: string) {
  const map: Record<string, string> = {
    LEAD: "bg-emerald-100 dark:bg-emerald-950/50",
    OPORTUNIDADE: "bg-purple-100 dark:bg-purple-950/50",
    VISITA: "bg-blue-100 dark:bg-blue-950/50",
    TAREFA: "bg-amber-100 dark:bg-amber-950/50",
    PROPOSTA: "bg-cyan-100 dark:bg-cyan-950/50",
  }
  return map[tipo] || "bg-slate-100 dark:bg-slate-800"
}

export default function CrmDashboardPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const { data, isLoading } = useQuery<CrmDashboardData>({
    queryKey: ["crm-dashboard"],
    queryFn: () => fetch("/api/crm/dashboard").then((r) => r.json()),
    retry: 1,
  })

  const pipelineData = [
    { name: "Leads", value: data?.leads.total ?? 0 },
    { name: "Oportunidades", value: data?.oportunidades.total ?? 0 },
    { name: "Propostas", value: data?.propostas.total ?? 0 },
    { name: "Convertidas", value: data?.conversao.oportunidadesConvertidas ?? 0 },
  ]

  const taxaConversao = data?.conversao.totalOportunidades
    ? ((data.conversao.oportunidadesConvertidas / data.conversao.totalOportunidades) * 100).toFixed(1)
    : "0.0"

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">CRM{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Dashboard comercial com métricas de pipeline, atividades e previsão
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* Linha 1: Cards de resumo */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <SummaryCard
              href="/comercial/crm/leads"
              icon={<UserPlus size={20} />}
              value={data?.leads.total ?? 0}
              label="Leads"
              sub={`${data?.leads.esteMes ?? 0} este mês`}
              bgColor="bg-emerald-100 dark:bg-emerald-950/50"
              iconColor="text-emerald-600 dark:text-emerald-400"
            />
            <SummaryCard
              href="/comercial/crm/pessoas"
              icon={<Building2 size={20} />}
              value={data?.pessoas.total ?? 0}
              label="Pessoas (Negócios)"
              bgColor="bg-blue-100 dark:bg-blue-950/50"
              iconColor="text-blue-600 dark:text-blue-400"
            />
            <SummaryCard
              href="/comercial/crm/oportunidades"
              icon={<Target size={20} />}
              value={data?.oportunidades.total ?? 0}
              label="Oportunidades"
              sub={`${data?.oportunidades.esteMes ?? 0} este mês`}
              bgColor="bg-purple-100 dark:bg-purple-950/50"
              iconColor="text-purple-600 dark:text-purple-400"
            />
            <SummaryCard
              href="/comercial/crm/propostas"
              icon={<FileText size={20} />}
              value={data?.propostas.total ?? 0}
              label="Propostas"
              bgColor="bg-cyan-100 dark:bg-cyan-950/50"
              iconColor="text-cyan-600 dark:text-cyan-400"
            />
            <SummaryCard
              href="/comercial/crm/visitas"
              icon={<Calendar size={20} />}
              value={data?.visitas.total ?? 0}
              label="Visitas"
              sub={data?.visitas.hoje ? `${data.visitas.hoje} hoje` : undefined}
              bgColor="bg-amber-100 dark:bg-amber-950/50"
              iconColor="text-amber-600 dark:text-amber-400"
            />
            <SummaryCard
              href="/comercial/crm/tarefas"
              icon={<CheckCircle2 size={20} />}
              value={data?.tarefas.pendentes ?? 0}
              label="Tarefas Pendentes"
              sub={data?.tarefas.vencendo ? `${data.tarefas.vencendo} vencidas` : undefined}
              bgColor="bg-rose-100 dark:bg-rose-950/50"
              iconColor="text-rose-600 dark:text-rose-400"
            />
          </div>

          {/* Linha 2: Pipeline, Forecast, Conversão */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Funil */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Pipeline (Funil)</h2>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={pipelineData} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" width={90} />
                  <Tooltip formatter={(value: any) => [value, "Registros"]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {pipelineData.map((_, i) => (
                      <Cell key={i} fill={PIPELINE_COLORS[i % PIPELINE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Forecast + Conversão */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Previsão & Conversão</h2>
              </div>
              <div className="space-y-4">
                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Previsão de Receita (Pipeline)</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(data?.forecast ?? 0)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
                    <Handshake size={16} className="text-green-600 dark:text-green-400 mb-1" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Convertidas</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {data?.conversao.oportunidadesConvertidas ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3">
                    <PieChart size={16} className="text-amber-600 dark:text-amber-400 mb-1" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Taxa Conversão</p>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{taxaConversao}%</p>
                  </div>
                </div>
              </div>
              {data?.previsaoVendas && data.previsaoVendas.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">Histórico de Previsão (últimos meses)</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={[...data.previsaoVendas].reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="periodo" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: any) => [formatCurrency(value), ""]} />
                      <Line type="monotone" dataKey="valorPrevisto" stroke="#6366f1" strokeWidth={2} dot={false} name="Previsto" />
                      <Line type="monotone" dataKey="valorReal" stroke="#22c55e" strokeWidth={2} dot={false} name="Real" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Oportunidades por Status (Pizza) */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieChart size={16} className="text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Oportunidades por Status</h2>
              </div>
              {data?.oportunidades.byStatus && data.oportunidades.byStatus.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <RPieChart>
                      <Pie
                        data={data.oportunidades.byStatus.map((s, i) => ({
                          name: s.status,
                          value: s.total,
                          fill: CHART_COLORS[i % CHART_COLORS.length],
                        }))}
                        cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                        dataKey="value"
                        isAnimationActive={false}
                      />
                      <Tooltip />
                    </RPieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                    {data.oportunidades.byStatus.map((s, i) => (
                      <span
                        key={s.status}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        {s.status}: {s.total}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">Nenhuma oportunidade</p>
              )}
            </div>
          </div>

          {/* Linha 3: Top Pessoas + Atividades Recentes */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Pessoas */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-500" />
                  Top Pessoas (Negócios)
                </h2>
                <Link href="/comercial/crm/pessoas" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  Ver todas <ArrowRight size={12} />
                </Link>
              </div>
              {data?.topEmpresas && data.topEmpresas.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.topEmpresas.map((emp, i) => (
                    <div key={emp.empresaId ?? i} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-slate-400 w-5">{i + 1}.</span>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {emp.empresaNome}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(emp.totalValor)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">Nenhuma oportunidade em aberto</p>
              )}
            </div>

            {/* Atividades Recentes */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Clock size={16} className="text-slate-500" />
                  Atividades Recentes
                </h2>
              </div>
              {data?.recentes && data.recentes.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.recentes.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-3 p-3">
                      <div className={`rounded-lg p-1.5 mt-0.5 ${getTipoBg(ev.tipo)}`}>
                        <span className={getTipoCor(ev.tipo)}>
                          {TIPO_EVENTO_ICON[ev.tipo] || <Clock size={14} />}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-900 dark:text-slate-100 leading-tight">{ev.descricao}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {ev.dataEvento
                            ? new Date(ev.dataEvento).toLocaleString("pt-BR", {
                                day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                              })
                            : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-sm text-slate-400">Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Ações Rápidas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <QuickAction href="/comercial/crm/leads/novo" icon={<UserPlus size={18} />} label="Novo Lead" color="text-emerald-600" bg="bg-emerald-100 dark:bg-emerald-950/50" />
              <QuickAction href="/comercial/crm/pessoas/novo" icon={<Building2 size={18} />} label="Nova Pessoa (Negócio)" color="text-blue-600" bg="bg-blue-100 dark:bg-blue-950/50" />
              <QuickAction href="/comercial/crm/oportunidades/novo" icon={<Target size={18} />} label="Nova Oportunidade" color="text-purple-600" bg="bg-purple-100 dark:bg-purple-950/50" />
              <QuickAction href="/comercial/crm/oportunidades/kanban" icon={<BarChart3 size={18} />} label="Kanban" color="text-indigo-600" bg="bg-indigo-100 dark:bg-indigo-950/50" />
              <QuickAction href="/comercial/crm/visitas/novo" icon={<Calendar size={18} />} label="Nova Visita" color="text-amber-600" bg="bg-amber-100 dark:bg-amber-950/50" />
              <QuickAction href="/comercial/crm/propostas/novo" icon={<FileText size={18} />} label="Nova Proposta" color="text-cyan-600" bg="bg-cyan-100 dark:bg-cyan-950/50" />
              <QuickAction href="/comercial/crm/tarefas" icon={<CheckCircle2 size={18} />} label="Minhas Tarefas" color="text-rose-600" bg="bg-rose-100 dark:bg-rose-950/50" />
            </div>
          </div>
        </>
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
