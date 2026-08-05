"use client"

import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChartCard } from "@/components/ui/chart-card"
import { ChartTooltip } from "@/components/ui/chart-tooltip"
import { AnimatedLine } from "@/components/ui/animated-line"

const STATUS_LABELS: Record<string, string> = {
  SOLICITADO: "Solicitado",
  PROCESSANDO: "Processando",
  ATENDIDO: "Atendido",
}

const STATUS_COLORS: Record<string, string> = {
  SOLICITADO: "#f59e0b",
  PROCESSANDO: "#6366f1",
  ATENDIDO: "#22c55e",
}

interface ReqCorteChartsProps {
  stats: any
}

export function ReqCorteCharts({ stats }: ReqCorteChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Distribuição por Status" delay={0}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={(stats?.statusDistribution || []).map((s: any) => ({
                name: STATUS_LABELS[s.status] || s.status,
                value: s.total,
              }))}
              cx="50%" cy="50%" innerRadius={50} outerRadius={85}
              dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}
              startAngle={90}
              endAngle={-270}
              animationDuration={2500}
              animationEasing="ease-in-out"
              animationBegin={800}
            >
              {(stats?.statusDistribution || []).map((s: any) => (
                <Cell key={s.status} fill={STATUS_COLORS[s.status] || "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Requisições por Mês" delay={300}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={stats?.monthlyTrend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip content={<ChartTooltip formatter={(v) => `${v || 0} requisições`} />} />
            <AnimatedLine type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} activeDot={{ r: 7, stroke: "#6366f1", strokeWidth: 2, fill: "#fff" }} drawDuration={2000} drawDelay={1100} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
