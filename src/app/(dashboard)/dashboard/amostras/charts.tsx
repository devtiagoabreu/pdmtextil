"use client"

import { PieChart, Pie, BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChartCard } from "@/components/ui/chart-card"
import { ChartTooltip } from "@/components/ui/chart-tooltip"
import { AnimatedLine } from "@/components/ui/animated-line"

const TIPO_LABELS: Record<string, string> = {
  TECIDO_CRU: "Tecido Cru",
  ACABAMENTO: "Acabamento",
}

const TIPO_CHART_COLORS: Record<string, string> = {
  TECIDO_CRU: "#06b6d4",
  ACABAMENTO: "#f97316",
}

const TREND_COLOR = "#06b6d4"

interface AmostrasChartsProps {
  stats: any
  getLabel: (status: string) => string
  getColor: (status: string) => string
}

export function AmostrasCharts({ stats, getLabel, getColor }: AmostrasChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <ChartCard title="Distribuição por Status" delay={0}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={(stats?.statusDistribution || []).map((s: any) => ({
                name: getLabel(s.status) || s.status,
                value: s.total,
              }))}
              cx="50%" cy="50%" innerRadius={50} outerRadius={85}
              dataKey="value" label={({ name, value }: any) => value > 0 ? `${name}: ${value}` : ""}
              startAngle={90}
              endAngle={-270}
              animationDuration={2500}
              animationEasing="ease-in-out"
              animationBegin={800}
            >
              {(stats?.statusDistribution || []).map((s: any) => (
                <Cell key={s.status} fill={getColor(s.status) || "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Amostras por Tipo" delay={300}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={(stats?.tipoDistribution || []).map((s: any) => ({
            name: TIPO_LABELS[s.tipo] || s.tipo,
            total: s.total,
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip content={<ChartTooltip formatter={(v) => `${v || 0} amostras`} />} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} animationDuration={1800} animationEasing="ease-in-out" animationBegin={1100}>
              {(stats?.tipoDistribution || []).map((s: any) => (
                <Cell key={s.tipo} fill={TIPO_CHART_COLORS[s.tipo] || "#6366f1"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Amostras por Mês" delay={600}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={stats?.monthlyTrend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip content={<ChartTooltip formatter={(v) => `${v || 0} amostras`} />} />
            <AnimatedLine type="monotone" dataKey="total" stroke={TREND_COLOR} strokeWidth={2} dot={{ fill: TREND_COLOR, r: 4 }} activeDot={{ r: 7, stroke: TREND_COLOR, strokeWidth: 2, fill: "#fff" }} drawDuration={2000} drawDelay={1400} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
