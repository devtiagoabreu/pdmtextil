"use client"

import { BarChart, Bar, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { BarChart3, CalendarClock, Layers, ShoppingCart, TrendingUp } from "lucide-react"
import { ChartCard } from "@/components/ui/chart-card"
import { ChartTooltip } from "@/components/ui/chart-tooltip"
import { StatCard } from "./bi-stat-card"
import { COLORS } from "./bi-constants"

export function DashboardTab({ sheetData }: { sheetData: any }) {
  return (
    <>
      {sheetData.metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Faturamento Total" value={sheetData.metrics.totalVendas} icon={TrendingUp} prefix="R$ " />
          <StatCard label="Representantes" value={sheetData.metrics.totalRepresentantes} icon={Layers} />
          <StatCard label="Clientes Atendidos" value={sheetData.metrics.totalClientes} icon={ShoppingCart} />
          <StatCard label="Linhas (Itens)" value={sheetData.metrics.totalLinhas} icon={BarChart3} />
          <StatCard label="Previsão do Mês" value={sheetData.previsao?.projecaoMes ?? 0} icon={CalendarClock} prefix="R$ " />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Faturamento por Representante" delay={0}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={(sheetData.revenueByRep || []).slice(0, 15)}
              layout="vertical"
              margin={{ left: 20, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis dataKey="nome" type="category" tick={{ fontSize: 10 }} stroke="#94a3b8" width={180} />
              <Tooltip content={<ChartTooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`} />} />
              <Bar dataKey="valor" radius={[0, 4, 4, 0]} animationDuration={1800}>
                {(sheetData.revenueByRep || []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Evolução Mensal do Faturamento" delay={200}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={sheetData.monthlyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip content={<ChartTooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`} />} />
              <Line type="monotone" dataKey="valor" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Curva ABC - Artigos" delay={400}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={(sheetData.abcCurve || []).slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="grupo" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip content={<ChartTooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`} />} />
              <Bar dataKey="valorTotal" radius={[4, 4, 0, 0]} animationDuration={1800} animationBegin={600}>
                {(sheetData.abcCurve || []).map((item: any) => (
                  <Cell key={item.grupo} fill={item.classe === "A" ? "#ef4444" : item.classe === "B" ? "#f97316" : "#22c55e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribuição Geográfica (UF)" delay={600}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={(sheetData.geoDistribution || []).slice(0, 10)}
                dataKey="valor"
                nameKey="uf"
                cx="50%" cy="50%"
                outerRadius={100}
                label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                animationDuration={2500}
                animationBegin={800}
              >
                {(sheetData.geoDistribution || []).slice(0, 10).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`} />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Previsão e Projeções" delay={800}>
          <div className="space-y-3 p-1">
            {(() => {
              const p = sheetData.previsao || {}
              const itens = [
                { label: "Média diária no período", value: p.mediaDiaria ?? 0, money: true },
                { label: "Projeção do mês atual", value: p.projecaoMes ?? 0, money: true },
                { label: "Projeção próximos 30 dias", value: p.projecaoProximos30 ?? 0, money: true },
                { label: "Projeção próximo mês (média 3m)", value: p.projecaoProximoMes ?? 0, money: true },
                { label: "Dias cobertos pelos dados", value: p.diasCobertos ?? 0, money: false },
              ]
              return itens.map(x => (
                <div key={x.label} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-800 last:border-0 pb-2 last:pb-0">
                  <span className="text-slate-500 dark:text-slate-400">{x.label}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {x.money
                      ? `R$ ${x.value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
                      : x.value.toLocaleString("pt-BR")}
                  </span>
                </div>
              ))
            })()}
          </div>
        </ChartCard>
      </div>
    </>
  )
}
