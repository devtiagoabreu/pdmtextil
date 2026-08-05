"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { Activity, UserCheck } from "lucide-react"
import { ChartTooltip } from "@/components/ui/chart-tooltip"

const TIPO_CORES: Record<string, string> = {
  DELECAO: "#ef4444",
  ERRO_SISTEMA: "#f97316",
  LOGIN: "#3b82f6",
  CADASTRO: "#22c55e",
  SISTEMA: "#6366f1",
}

const TIPO_LABELS: Record<string, string> = {
  DELECAO: "Deleção",
  ERRO_SISTEMA: "Erro",
  LOGIN: "Login",
  CADASTRO: "Cadastro",
  SISTEMA: "Sistema",
}

interface AtividadeUsuarioChartsProps {
  porUsuario: any[]
  porTipo: any[]
}

export function AtividadeUsuarioCharts({ porUsuario, porTipo }: AtividadeUsuarioChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {porUsuario.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            <UserCheck size={16} className="inline mr-1" /> Ações por Usuário
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porUsuario} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="usuario" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="total" name="Ações" fill="#6366f1" radius={[0, 4, 4, 0]} animationDuration={1000} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {porTipo.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            <Activity size={16} className="inline mr-1" /> Distribuição por Tipo
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={porTipo}
                  dataKey="total"
                  nameKey="tipo"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(props: any) => `${TIPO_LABELS[props.tipo] || props.tipo} ${(props.percent * 100).toFixed(0)}%`}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {porTipo.map((entry: any, i: any) => (
                    <Cell key={i} fill={TIPO_CORES[entry.tipo] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend formatter={(value) => TIPO_LABELS[value] || value} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
