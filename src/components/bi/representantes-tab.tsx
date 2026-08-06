"use client"

import { AlertTriangle, BarChart3, Medal, TrendingUp, Trophy, Users } from "lucide-react"
import { StatCard } from "./bi-stat-card"
import { RankList } from "./bi-rank-list"

function RepRankingTable({ reps }: { reps: any[] }) {
  if (!reps.length) return <p className="text-sm text-slate-500 py-4 text-center">Nenhum representante no período.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className="text-left py-2 px-2 font-medium text-slate-500">#</th>
            <th className="text-left py-2 px-2 font-medium text-slate-500">Representante</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Faturado</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Metros</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Nº Itens</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Ticket Médio</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Clientes</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Última Venda</th>
          </tr>
        </thead>
        <tbody>
          {reps.map((r, i) => (
            <tr key={r.nome} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="py-2 px-2 text-slate-500">{i + 1}</td>
              <td className="py-2 px-2 font-medium text-slate-800 dark:text-slate-200">{r.nome}</td>
              <td className="py-2 px-2 text-right font-medium text-slate-800 dark:text-slate-200">
                R$ {r.totalVendas.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-2 text-right text-slate-500">{r.totalQtd.toLocaleString("pt-BR")}</td>
              <td className="py-2 px-2 text-right text-slate-500">{r.count.toLocaleString("pt-BR")}</td>
              <td className="py-2 px-2 text-right text-slate-500">
                R$ {r.ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-2 text-right text-slate-500">{r.numClientes}</td>
              <td className="py-2 px-2 text-right text-slate-500">
                {r.ultimaData ? new Date(r.ultimaData).toLocaleDateString("pt-BR") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function RepresentantesTab({ sheetData }: { sheetData: any }) {
  const reps = sheetData.repResumo || []
  const byQtd = [...reps].sort((a, b) => b.totalQtd - a.totalQtd)
  const totalVendas = reps.reduce((s: number, r: any) => s + r.totalVendas, 0)
  const totalQtd = reps.reduce((s: number, r: any) => s + r.totalQtd, 0)
  const fmtValor = (v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`
  const fmtQtd = (v: number) => `${v.toLocaleString("pt-BR")} m`
  const painel = (titulo: string, icone: any, items: any[], metric: "totalVendas" | "totalQtd", format: (v: number) => string, vazio: string) => (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
        {icone}
        {titulo}
      </h3>
      {items.length > 0 ? (
        <RankList items={items} metric={metric} format={format} />
      ) : (
        <p className="text-xs text-slate-400">{vazio}</p>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Representantes" value={reps.length} icon={Users} />
        <StatCard label="Faturamento Total" value={totalVendas} icon={TrendingUp} prefix="R$ " />
        <StatCard label="Metros Totais" value={totalQtd} icon={BarChart3} />
        <StatCard label="Faturamento Média/Rep" value={reps.length ? totalVendas / reps.length : 0} icon={Medal} prefix="R$ " />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {painel("Top 5 Faturamento", <Trophy className="w-4 h-4 text-amber-500" />, reps.slice(0, 5), "totalVendas", fmtValor, "Sem dados no período")}
        {painel("Top 5 Metros", <BarChart3 className="w-4 h-4 text-indigo-500" />, byQtd.slice(0, 5), "totalQtd", fmtQtd, "Sem dados no período")}
        {painel("5 Menores Faturamento", <AlertTriangle className="w-4 h-4 text-red-500" />, reps.slice(-5).reverse(), "totalVendas", fmtValor, "Sem dados no período")}
        {painel("5 Menores Metros", <AlertTriangle className="w-4 h-4 text-red-500" />, byQtd.slice(-5).reverse(), "totalQtd", fmtQtd, "Sem dados no período")}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Ranking Geral de Representantes
        </h3>
        <RepRankingTable reps={reps} />
      </div>
    </div>
  )
}
