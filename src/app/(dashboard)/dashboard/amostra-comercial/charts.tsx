"use client"

import { PieChart, Pie, BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChartCard } from "@/components/ui/chart-card"
import { ChartTooltip } from "@/components/ui/chart-tooltip"
import { AnimatedLine } from "@/components/ui/animated-line"

const TREND_COLOR = "#06b4d4"

interface AmostraComercialChartsProps {
  stats: any
  getLabel: (status: string) => string
  getColor: (status: string) => string
}

export function AmostraComercialCharts({ stats, getLabel, getColor }: AmostraComercialChartsProps) {
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

      <ChartCard title="Por Mês" delay={300}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats?.monthlyTrend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip content={<ChartTooltip formatter={(v) => `${v || 0} requisições`} />} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} fill={TREND_COLOR} animationDuration={1800} animationEasing="ease-in-out" animationBegin={1100} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Tendência" delay={600}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={stats?.monthlyTrend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip content={<ChartTooltip formatter={(v) => `${v || 0} requisições`} />} />
            <AnimatedLine type="monotone" dataKey="total" stroke={TREND_COLOR} strokeWidth={2} dot={{ fill: TREND_COLOR, r: 4 }} activeDot={{ r: 7, stroke: TREND_COLOR, strokeWidth: 2, fill: "#fff" }} drawDuration={2000} drawDelay={1400} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
