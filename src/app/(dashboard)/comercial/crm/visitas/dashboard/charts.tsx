"use client"

import {
  BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { PieChart as PieChartIcon, BarChart3 } from "lucide-react"
import { ChartTooltip } from "@/components/ui/chart-tooltip"

type VisitasDashboardData = {
  total: number
  realizadas: number
  canceladas: number
  agendadas: number
  hoje: number
  esteMes: number
  byTipo: { tipo: string; total: number }[]
  byStatus: { status: string; total: number }[]
  porRepresentante: { representanteId: number | null; representanteNome: string; total: number }[]
  ultimasVisitas: { id: number; empresaId: number; clienteId: number | null; dataVisita: string; hora: string | null; tipo: string; status: string; endereco: string | null; numero: string | null; complemento: string | null; bairro: string | null; cidade: string | null; uf: string | null }[]
  pesquisas: { enviadas: number; abertas: number; respondidas: number }
}

const TIPO_CORES: Record<string, string> = {
  PRESENCIAL: "#6366f1",
  VIDEO: "#06b6d4",
  TELEFONE: "#f97316",
}

const STATUS_CORES: Record<string, string> = {
  AGENDADA: "#6366f1",
  EM_ANDAMENTO: "#f97316",
  REALIZADA: "#22c55e",
  CANCELADA: "#ef4444",
}

const STATUS_LABELS: Record<string, string> = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em Andamento",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
}

const TIPO_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  VIDEO: "Vídeo",
  TELEFONE: "Telefone",
}

const CHART_COLORS = ["#6366f1", "#06b6d4", "#f97316", "#22c55e", "#ef4444", "#8b5cf6"]

export function VisitasCharts({
  data,
  openModal,
}: {
  data: VisitasDashboardData | undefined
  openModal: (filtro: string) => void
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Visitas por Tipo (Pizza) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Visitas por Tipo</h2>
        </div>
        {data?.byTipo && data.byTipo.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <RPieChart>
                <Pie
                  data={data.byTipo.map((t: any) => ({
                    name: TIPO_LABELS[t.tipo] || t.tipo,
                    value: t.total,
                    fill: TIPO_CORES[t.tipo] || "#6366f1",
                  }))}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80}
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
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {data.byTipo.map((t: any) => (
                <button
                  key={t.tipo}
                  type="button"
                  onClick={() => openModal(`tipo-${t.tipo}`)}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: TIPO_CORES[t.tipo] || "#6366f1" }}
                  />
                  {TIPO_LABELS[t.tipo] || t.tipo}: {t.total}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">Nenhuma visita registrada</p>
        )}
      </div>

      {/* Visitas por Status (Barra) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Visitas por Status</h2>
        </div>
        {data?.byStatus && data.byStatus.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.byStatus.map((s: any) => ({
                  name: STATUS_LABELS[s.status] || s.status,
                  value: s.total,
                }))}
                margin={{ left: 10, right: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v} visitas`} />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={1800} animationEasing="ease-in-out" animationBegin={800}>
                  {data.byStatus.map((s: any, i: any) => (
                    <Cell key={i} fill={STATUS_CORES[s.status] || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              {data.byStatus.map((s: any, i: any) => (
                <button
                  key={s.status}
                  type="button"
                  onClick={() => openModal(`status-${s.status}`)}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: STATUS_CORES[s.status] || CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  {STATUS_LABELS[s.status] || s.status}: {s.total}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">Nenhuma visita registrada</p>
        )}
      </div>
    </div>
  )
}
