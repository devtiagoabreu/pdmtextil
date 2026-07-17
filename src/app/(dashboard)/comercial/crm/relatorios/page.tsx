"use client"

import { useQuery } from "@tanstack/react-query"
import {
  BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { Building2, UserPlus, Target, Calendar, TrendingUp, PieChart, FileText } from "lucide-react"
import { getInfoContent } from "@/lib/info-content"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { ChartTooltip } from "@/components/ui/chart-tooltip"

const CHART_COLORS = ["#6366f1", "#06b6d4", "#f97316", "#22c55e", "#ef4444", "#8b5cf6", "#14b8a6", "#eab308"]

const PIPELINE_LABELS: Record<string, string> = {
  NOVO: "Novo",
  QUALIFICACAO: "Qualificação",
  PROPOSTA: "Proposta",
  NEGOCIACAO: "Negociação",
  FECHADO_GANHO: "Ganho",
  FECHADO_PERDIDO: "Perdido",
}

const PROPOSTA_LABELS: Record<string, string> = {
  ENVIADA: "Enviada",
  ACEITA: "Aceita",
  RECUSADA: "Recusada",
  REVISAO: "Revisão",
}

async function fetchRelatorios() {
  const res = await fetch("/api/crm/relatorios")
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function CrmRelatoriosPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)

  const { data, isLoading } = useQuery({
    queryKey: ["crm-relatorios"],
    queryFn: fetchRelatorios,
    retry: 1,
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Relatórios CRM{info && <InfoButton content={info} />}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Análise consolidada de leads, pipeline, conversão e performance comercial
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-slate-400">Erro ao carregar dados</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <CardEstatistica icon={<Building2 size={18} />} value={data.totalEmpresas} label="Negócios" color="text-blue-600" bg="bg-blue-100 dark:bg-blue-950/50" />
            <CardEstatistica icon={<UserPlus size={18} />} value={data.totalLeads} label="Leads" color="text-emerald-600" bg="bg-emerald-100 dark:bg-emerald-950/50" />
            <CardEstatistica icon={<Target size={18} />} value={data.totalOportunidades} label="Oportunidades" color="text-purple-600" bg="bg-purple-100 dark:bg-purple-950/50" />
            <CardEstatistica icon={<Calendar size={18} />} value={data.totalVisitas} label="Visitas" color="text-amber-600" bg="bg-amber-100 dark:bg-amber-950/50" />
            <CardEstatistica icon={<TrendingUp size={18} />} value={data.totalCampanhas} label="Campanhas" color="text-cyan-600" bg="bg-cyan-100 dark:bg-cyan-950/50" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <GraficoCard titulo="Leads por Origem" icone={<UserPlus size={16} />}>
              {data.leadsPorOrigem && data.leadsPorOrigem.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <RPieChart>
                      <Pie
                        data={data.leadsPorOrigem.map((s: any, i: number) => ({
                          name: s.origem,
                          value: s.total,
                          fill: CHART_COLORS[i % CHART_COLORS.length],
                        }))}
                        cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                        startAngle={90}
                        endAngle={-270}
                        animationDuration={2500}
                        animationEasing="ease-in-out"
                        animationBegin={0}
                      />
                      <Tooltip content={<ChartTooltip />} />
                    </RPieChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-12">Nenhum dado</p>
              )}
            </GraficoCard>

            <GraficoCard titulo="Pipeline (Oportunidades por Status)" icone={<Target size={16} />}>
              {data.oportunidadesPorStatus && data.oportunidadesPorStatus.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.oportunidadesPorStatus.map((s: any) => ({
                      name: PIPELINE_LABELS[s.status] || s.status,
                      total: s.total,
                      valor: s.valor,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <Tooltip content={<ChartTooltip formatter={(v, name) => name === "valor" ? formatCurrency(v) : String(v)} />} />
                      <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Registros" animationDuration={1800} animationEasing="ease-in-out" animationBegin={200} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-12">Nenhum dado</p>
              )}
            </GraficoCard>

            <GraficoCard titulo="Oportunidades por Representante" icone={<FileText size={16} />}>
              {data.oportunidadesPorResponsavel && data.oportunidadesPorResponsavel.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.oportunidadesPorResponsavel} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} stroke="#94a3b8" width={90} />
                    <Tooltip content={<ChartTooltip formatter={(v) => `${v} registros`} />} />
                    <Bar dataKey="total" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Oportunidades" animationDuration={1800} animationEasing="ease-in-out" animationBegin={400} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-400 text-center py-12">Nenhum dado</p>
              )}
            </GraficoCard>

            <GraficoCard titulo="Propostas por Status" icone={<FileText size={16} />}>
              {data.propostasPorStatus && data.propostasPorStatus.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <RPieChart>
                      <Pie
                        data={data.propostasPorStatus.map((s: any, i: number) => ({
                          name: PROPOSTA_LABELS[s.status] || s.status,
                          value: s.total,
                          fill: CHART_COLORS[i % CHART_COLORS.length],
                        }))}
                        cx="50%" cy="50%" innerRadius={40} outerRadius={80}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        animationDuration={2500}
                        animationEasing="ease-in-out"
                        animationBegin={200}
                      >
                        {data.propostasPorStatus.map((_: any, i: number) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </RPieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 justify-center mt-1">
                    {data.propostasPorStatus.map((s: any, i: number) => (
                      <span key={s.status} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        {PROPOSTA_LABELS[s.status] || s.status}: {s.total}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-12">Nenhum dado</p>
              )}
            </GraficoCard>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <GraficoCard titulo="Tarefas por Status" icone={<Target size={16} />}>
              {data.tarefasPorStatus && data.tarefasPorStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.tarefasPorStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} name="Tarefas" animationDuration={1800} animationEasing="ease-in-out" animationBegin={300} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-400 text-center py-12">Nenhum dado</p>
              )}
            </GraficoCard>

            <GraficoCard titulo="Taxa de Conversão" icone={<PieChart size={16} />}>
              {data.taxaConversao && data.taxaConversao.total > 0 ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <RPieChart>
                        <Pie
                          data={[
                            { name: "Ganhas", value: data.taxaConversao.ganhas },
                            { name: "Perdidas", value: data.taxaConversao.perdidas },
                            { name: "Abertas", value: data.taxaConversao.total - data.taxaConversao.ganhas - data.taxaConversao.perdidas },
                          ]}
                          cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                          dataKey="value"
                          animationDuration={1000}
                          animationEasing="ease-out"
                        >
                          <Cell fill="#22c55e" />
                          <Cell fill="#ef4444" />
                          <Cell fill="#94a3b8" />
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </RPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{data.taxaConversao.taxa}%</p>
                    <p className="text-xs text-slate-500">
                      {data.taxaConversao.ganhas} ganhas de {data.taxaConversao.total}
                    </p>
                  </div>
                  <div className="flex gap-4 mt-3 text-xs">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Ganhas: {data.taxaConversao.ganhas}</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Perdidas: {data.taxaConversao.perdidas}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-12">Nenhum dado</p>
              )}
            </GraficoCard>
          </div>
        </>
      )}
    </div>
  )
}

function CardEstatistica({ icon, value, label, color, bg }: { icon: React.ReactNode; value: number; label: string; color: string; bg: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg ${bg} p-2.5`}>
          <span className={color}>{icon}</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  )
}

function GraficoCard({ titulo, icone, children }: { titulo: string; icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-slate-400">{icone}</span>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{titulo}</h2>
      </div>
      {children}
    </div>
  )
}
