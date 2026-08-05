"use client"

import { useQuery } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  Building2, Users, Target, UserPlus, Clock, CheckCircle2,
  FileText, Calendar, ArrowRight, Handshake, XCircle, AlertCircle,
  BarChart3, Megaphone, Mail, Eye, MousePointerClick,
} from "lucide-react"

const CrmCharts = dynamic(() => import("./charts").then((m) => m.CrmCharts), { ssr: false })

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
  campanhas: { total: number; ativas: number; orcamentoTotal: number }
  emailMassa: { enviados: number; lidos: number; clicados: number }
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
  const { data, isLoading, isError } = useQuery<CrmDashboardData>({
    queryKey: ["crm-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/crm/dashboard")
      if (!res.ok) throw new Error("Falha ao carregar dashboard")
      return res.json()
    },
    retry: 1,
  })

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
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Erro ao carregar dashboard</p>
          <p className="text-xs text-slate-400 mt-1">Verifique se as tabelas do CRM existem no banco de dados.</p>
        </div>
      ) : (
        <>
          {/* Linha 1: Cards de resumo */}
           <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
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
            <SummaryCard
              href="/comercial/crm/campanhas"
              icon={<Megaphone size={20} />}
              value={data?.campanhas.total ?? 0}
              label="Campanhas"
              sub={`${data?.campanhas.ativas ?? 0} ativas`}
              bgColor="bg-violet-100 dark:bg-violet-950/50"
              iconColor="text-violet-600 dark:text-violet-400"
            />
            <SummaryCard
              href="/admin/email-massa"
              icon={<Mail size={20} />}
              value={data?.emailMassa.enviados ?? 0}
              label="Emails Enviados"
              sub={`${data?.emailMassa.clicados ?? 0} cliques · ${data?.emailMassa.lidos ?? 0} abertos`}
              bgColor="bg-teal-100 dark:bg-teal-950/50"
              iconColor="text-teal-600 dark:text-teal-400"
            />
          </div>

          {/* Linha 2: Pipeline, Forecast, Conversão */}
          <div className="grid gap-6 md:grid-cols-3">
            <CrmCharts data={data} />
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
                  {data.topEmpresas.map((emp: any, i: any) => (
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
                  {data.recentes.map((ev: any) => (
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
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3">
              <QuickAction href="/comercial/crm/leads/novo" icon={<UserPlus size={18} />} label="Novo Lead" color="text-emerald-600" bg="bg-emerald-100 dark:bg-emerald-950/50" />
              <QuickAction href="/comercial/crm/pessoas/novo" icon={<Building2 size={18} />} label="Nova Pessoa (Negócio)" color="text-blue-600" bg="bg-blue-100 dark:bg-blue-950/50" />
              <QuickAction href="/comercial/crm/oportunidades/novo" icon={<Target size={18} />} label="Nova Oportunidade" color="text-purple-600" bg="bg-purple-100 dark:bg-purple-950/50" />
              <QuickAction href="/comercial/crm/oportunidades/kanban" icon={<BarChart3 size={18} />} label="Kanban" color="text-indigo-600" bg="bg-indigo-100 dark:bg-indigo-950/50" />
              <QuickAction href="/comercial/crm/visitas/novo" icon={<Calendar size={18} />} label="Nova Visita" color="text-amber-600" bg="bg-amber-100 dark:bg-amber-950/50" />
              <QuickAction href="/comercial/crm/propostas/novo" icon={<FileText size={18} />} label="Nova Proposta" color="text-cyan-600" bg="bg-cyan-100 dark:bg-cyan-950/50" />
              <QuickAction href="/comercial/crm/campanhas/nova" icon={<Megaphone size={18} />} label="Nova Campanha" color="text-violet-600" bg="bg-violet-100 dark:bg-violet-950/50" />
              <QuickAction href="/admin/email-massa" icon={<Mail size={18} />} label="Email Massa" color="text-teal-600" bg="bg-teal-100 dark:bg-teal-950/50" />
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
