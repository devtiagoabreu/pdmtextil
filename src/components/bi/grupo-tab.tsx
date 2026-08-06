"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Layers, Search, Users } from "lucide-react"
import { ChartCard } from "@/components/ui/chart-card"
import { ChartTooltip } from "@/components/ui/chart-tooltip"
import { ClientesTable } from "./bi-clientes-table"
import { RankList } from "./bi-rank-list"

interface Props {
  grupoList: string[]
  searchGrupo: string
  setSearchGrupo: (v: string) => void
  selectedGrupo: string
  onSelectGrupo: (g: string) => void
  clientesData: any[]
  grupoReps: any[]
  loadingClientes: boolean
}

export function GrupoTab({
  grupoList,
  searchGrupo,
  setSearchGrupo,
  selectedGrupo,
  onSelectGrupo,
  clientesData,
  grupoReps,
  loadingClientes,
}: Props) {
  const filteredGrupos = grupoList.filter(g =>
    g.toLowerCase().includes(searchGrupo.toLowerCase()),
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            <Layers className="w-4 h-4 inline mr-1" />
            Selecione um Artigo
          </label>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchGrupo}
              onChange={e => setSearchGrupo(e.target.value)}
              placeholder="Buscar artigo (ex: K1820, T0093)..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {filteredGrupos.slice(0, 300).map(g => (
              <button
                key={g}
                onClick={() => onSelectGrupo(g)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedGrupo === g
                    ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">{grupoList.length} artigos no total</p>
        </div>
      </div>

      <div className="lg:col-span-2">
        {!selectedGrupo && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
            <Layers className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-500">Selecione um artigo ao lado para ver os clientes</p>
          </div>
        )}

        {loadingClientes && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        )}

        {selectedGrupo && !loadingClientes && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Clientes que compraram do artigo: <span className="text-indigo-600 dark:text-indigo-400">{selectedGrupo}</span>
            </h3>

            <ClientesTable clientes={clientesData} />
          </div>
        )}

        {selectedGrupo && !loadingClientes && grupoReps.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              <Users className="w-4 h-4 text-indigo-500" />
              Top Representantes do Artigo
            </h3>
            <RankList items={grupoReps.slice(0, 5)} metric="totalVendas" format={(v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`} />
          </div>
        )}

        {selectedGrupo && clientesData.length > 0 && (
          <ChartCard title={`Top Clientes - Artigo ${selectedGrupo}`} delay={100}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={clientesData.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis dataKey="razaoSocial" type="category" tick={{ fontSize: 9 }} stroke="#94a3b8" width={150} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`} />} />
                <Bar dataKey="totalFaturado" radius={[0, 4, 4, 0]} fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  )
}
