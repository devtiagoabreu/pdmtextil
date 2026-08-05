"use client"

import {
  LineChart, Line, BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { BarChart3, TrendingUp, PieChart, Handshake } from "lucide-react"
import { ChartTooltip } from "@/components/ui/chart-tooltip"
import { AnimatedLine } from "@/components/ui/animated-line"

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

const CHART_COLORS = ["#6366f1", "#06b6d4", "#f97316", "#22c55e", "#ef4444", "#8b5cf6"]
const PIPELINE_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#22c55e", "#ef4444"]

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function CrmCharts({ data }: { data: CrmDashboardData | undefined }) {
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
    <>
      {/* Funil */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Pipeline (Funil)</h2>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={pipelineData} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" width={80} interval={0} angle={0} tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 11) + '⬦' : v} />
            <Tooltip content={<ChartTooltip formatter={(v) => `${v} registros`} />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={1800} animationEasing="ease-in-out" animationBegin={800}>
              {pipelineData.map((_: any, i: any) => (
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
                <Tooltip content={<ChartTooltip formatter={(v) => formatCurrency(v)} />} />
                <AnimatedLine type="monotone" dataKey="valorPrevisto" stroke="#6366f1" strokeWidth={2} dot={false} name="Previsto" drawDuration={2000} drawDelay={1000} />
                <AnimatedLine type="monotone" dataKey="valorReal" stroke="#22c55e" strokeWidth={2} dot={false} name="Real" drawDuration={2000} drawDelay={1200} />
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
                  data={data.oportunidades.byStatus.map((s: any, i: any) => ({
                    name: s.status,
                    value: s.total,
                    fill: CHART_COLORS[i % CHART_COLORS.length],
                  }))}
                  cx="50%" cy="50%" innerRadius={40} outerRadius={70}
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
            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              {data.oportunidades.byStatus.map((s: any, i: any) => (
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
    </>
  )
}
