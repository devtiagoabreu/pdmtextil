"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { BarChart3 } from "lucide-react"
import { ChartTooltip } from "@/components/ui/chart-tooltip"

interface SolicitacoesConcluidasChartsProps {
  porMes: any[]
}

export function SolicitacoesConcluidasCharts({ porMes }: SolicitacoesConcluidasChartsProps) {
  if (porMes.length === 0) return null
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
        <BarChart3 size={16} className="inline mr-1" /> Concluídas por Mês
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={porMes}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<ChartTooltip />} />
            <Legend />
            <Bar dataKey="concluidas" name="Concluídas" fill="#22c55e" radius={[4, 4, 0, 0]} animationDuration={1000} animationEasing="ease-out" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
