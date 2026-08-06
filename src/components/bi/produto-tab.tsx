"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Package, Search } from "lucide-react"
import { ChartCard } from "@/components/ui/chart-card"
import { ChartTooltip } from "@/components/ui/chart-tooltip"
import { ClientesTable } from "./bi-clientes-table"

interface Props {
  produtoList: string[]
  searchProduto: string
  setSearchProduto: (v: string) => void
  selectedProduto: string
  onSelectProduto: (p: string) => void
  clientesData: any[]
  loadingClientes: boolean
}

export function ProdutoTab({
  produtoList,
  searchProduto,
  setSearchProduto,
  selectedProduto,
  onSelectProduto,
  clientesData,
  loadingClientes,
}: Props) {
  const filteredProdutos = produtoList.filter(p =>
    p.toLowerCase().includes(searchProduto.toLowerCase()),
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            <Package className="w-4 h-4 inline mr-1" />
            Selecione um Produto
          </label>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchProduto}
              onChange={e => setSearchProduto(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {filteredProdutos.slice(0, 200).map(p => (
              <button
                key={p}
                onClick={() => onSelectProduto(p)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedProduto === p
                    ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">{produtoList.length} produtos no total</p>
        </div>
      </div>

      <div className="lg:col-span-2">
        {!selectedProduto && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
            <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-500">Selecione um produto ao lado para ver os clientes</p>
          </div>
        )}

        {loadingClientes && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        )}

        {selectedProduto && !loadingClientes && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Clientes que compraram: <span className="text-indigo-600 dark:text-indigo-400">{selectedProduto}</span>
            </h3>

            <ClientesTable clientes={clientesData} />
          </div>
        )}

        {selectedProduto && clientesData.length > 0 && (
          <ChartCard title={`Top Clientes - ${selectedProduto}`} delay={100}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={clientesData.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis dataKey="razaoSocial" type="category" tick={{ fontSize: 9 }} stroke="#94a3b8" width={150} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`} />} />
                <Bar dataKey="totalFaturado" radius={[0, 4, 4, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  )
}
