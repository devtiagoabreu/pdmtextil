"use client"

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChartCard } from "@/components/ui/chart-card"
import { ChartTooltip } from "@/components/ui/chart-tooltip"
import { AnimatedLine } from "@/components/ui/animated-line"

const TIPO_LABELS: Record<string, string> = {
  DESENVOLVIMENTO_TECELAGEM: "Tecelagem",
  DESENVOLVIMENTO_BENEFICIAMENTO: "Beneficiamento",
}

const TIPO_COLORS: Record<string, string> = {
  DESENVOLVIMENTO_TECELAGEM: "#06b6d4",
  DESENVOLVIMENTO_BENEFICIAMENTO: "#f97316",
}

interface DashboardChartsProps {
  stats: any
  getStatusLabel: (status: string) => string
  getStatusColor: (status: string) => string
  openModal: (filtro: string) => void
}

export default function DashboardCharts({ stats, getStatusLabel, getStatusColor, openModal }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Solicitações por Mês" delay={0}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={stats?.monthlyTrend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip content={<ChartTooltip formatter={(v) => `${v || 0} solicitações`} />} />
            <AnimatedLine type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} activeDot={{ r: 7, stroke: "#6366f1", strokeWidth: 2, fill: "#fff" }} drawDuration={2000} drawDelay={800} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Distribuição por Status" delay={300}>
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
              startAngle={90}
              endAngle={-270}
              label={({ name, value }) => `${name}: ${value}`}
              animationDuration={2500}
              animationEasing="ease-in-out"
              animationBegin={1100}
            />
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          {(stats?.statusDistribution || []).map((s: any) => {
            const map: Record<string, string> = {
              PENDENTE: "pendentes",
              EM_DESENVOLVIMENTO: "em-desenvolvimento",
              PILOTAGEM: "pilotagem",
              CONCLUIDO_DEV: "concluido-dev",
              APROVADO_CLI: "aprovado-cliente",
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
      </ChartCard>

      <ChartCard title="Solicitações por Tipo" delay={600}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={(stats?.tipoDistribution || []).map((s: any) => ({
            name: TIPO_LABELS[s.tipo] || s.tipo,
            total: s.total,
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip content={<ChartTooltip formatter={(v) => `${v || 0} solicitações`} />} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} animationDuration={1800} animationEasing="ease-in-out" animationBegin={1400}>
              {(stats?.tipoDistribution || []).map((s: any) => (
                <Cell key={s.tipo} fill={TIPO_COLORS[s.tipo] || "#6366f1"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
