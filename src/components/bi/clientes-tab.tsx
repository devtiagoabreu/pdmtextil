"use client"

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AlertTriangle, TrendingUp, UserCheck, Users } from "lucide-react"
import { ChartCard } from "@/components/ui/chart-card"
import { StatCard } from "./bi-stat-card"
import { COLORS } from "./bi-constants"

function ClienteCurvaTable({ clientes }: { clientes: any[] }) {
  if (!clientes.length) return <p className="text-sm text-slate-500 py-4 text-center">Nenhum cliente encontrado.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className="text-left py-2 px-2 font-medium text-slate-500">Cliente</th>
            <th className="text-left py-2 px-2 font-medium text-slate-500">Cidade/UF</th>
            <th className="text-left py-2 px-2 font-medium text-slate-500">Curva</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Freq. média</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Última compra</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Próxima prevista</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Sem comprar</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Faturado</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Metros</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Compras</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr
              key={c.razaoSocial}
              className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                c.alerta ? "bg-red-50 dark:bg-red-950/20" : ""
              }`}
            >
              <td className="py-2 px-2 font-medium text-slate-800 dark:text-slate-200">
                {c.razaoSocial}
                {c.alerta && (
                  <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 font-semibold">
                    <AlertTriangle className="w-3 h-3" />
                    Alerta
                  </span>
                )}
              </td>
              <td className="py-2 px-2 text-slate-500">{c.cidade}/{c.uf}</td>
              <td className="py-2 px-2 text-slate-700 dark:text-slate-300">{c.classificacao}</td>
              <td className="py-2 px-2 text-right text-slate-500">
                {c.intervaloMedio ? `${Math.round(c.intervaloMedio)} dias` : "—"}
              </td>
              <td className="py-2 px-2 text-right text-slate-500">
                {c.ultimaData ? new Date(c.ultimaData).toLocaleDateString("pt-BR") : "—"}
              </td>
              <td className="py-2 px-2 text-right text-slate-500">
                {c.proximaCompra ? new Date(c.proximaCompra).toLocaleDateString("pt-BR") : "—"}
              </td>
              <td className="py-2 px-2 text-right font-semibold text-slate-700 dark:text-slate-300">
                {c.diasDesdeUltima !== null ? `${c.diasDesdeUltima} dias` : "—"}
              </td>
              <td className="py-2 px-2 text-right text-slate-500">
                R$ {c.totalVendas.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-2 text-right text-slate-500">{c.totalQtd.toLocaleString("pt-BR")}</td>
              <td className="py-2 px-2 text-right text-slate-500">{c.compras}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface Props {
  sheetData: any
  filtroClientes: "todos" | "alerta"
  setFiltroClientes: (f: "todos" | "alerta") => void
}

export function ClientesTab({ sheetData, filtroClientes, setFiltroClientes }: Props) {
  const clientes = sheetData.clientesResumo || []
  const alertas = clientes.filter((c: any) => c.alerta)
  const comCurva = clientes.filter((c: any) => c.classificacao !== "Sem curva")
  const shown = filtroClientes === "alerta" ? alertas : clientes
  const dist: Record<string, number> = {}
  for (const c of clientes) {
    dist[c.classificacao] = (dist[c.classificacao] || 0) + 1
  }
  const distData: { nome: string; valor: number }[] = Object.entries(dist)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor)

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-400 dark:text-slate-500">
        Análise de curva de compra baseada em todo o histórico carregado da planilha.
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total de Clientes" value={clientes.length} icon={Users} />
        <StatCard label="Com Curva Detectada" value={comCurva.length} icon={UserCheck} />
        <StatCard label="Em Alerta (saiu da curva)" value={alertas.length} icon={AlertTriangle} />
        <StatCard label="Ticket Médio" value={clientes.length ? clientes.reduce((s: number, c: any) => s + c.totalVendas, 0) / clientes.length : 0} icon={TrendingUp} prefix="R$ " />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Distribuição por Curva de Compra" delay={0}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="nome" tick={{ fontSize: 9 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                {distData.map((d: any, i: number) => (
                  <Cell key={i} fill={d.nome === "Sem curva" ? "#94a3b8" : COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mr-auto">
              Clientes em alerta
            </h3>
            <button
              onClick={() => setFiltroClientes("todos")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filtroClientes === "todos"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Todos ({clientes.length})
            </button>
            <button
              onClick={() => setFiltroClientes("alerta")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filtroClientes === "alerta"
                  ? "bg-red-600 text-white"
                  : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40"
              }`}
            >
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Em alerta ({alertas.length})
            </button>
          </div>
          {filtroClientes === "alerta" && alertas.length > 0 && (
            <div className="mb-3 space-y-2 max-h-40 overflow-y-auto">
              {alertas.slice(0, 8).map((c: any) => (
                <div key={c.razaoSocial} className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{c.razaoSocial}</p>
                    <p className="text-slate-500">{c.alertaMotivo}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <ClienteCurvaTable clientes={shown} />
        </div>
      </div>
    </div>
  )
}
