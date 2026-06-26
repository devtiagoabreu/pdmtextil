"use client"

import { useCallback, useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { BarChart3, Filter } from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { exportCSV, exportPDFRelatorio } from "@/lib/export-utils"
import { useStatuses, hexToRgba } from "@/hooks/use-statuses"

type Stats = {
  totalCriadas: number
  totalDeletadas: number
  concluidas: number
  emAndamento: number
  taxaSucesso: number
}

type MesData = {
  mes: string
  criadas: number
  deletadas: number
  concluidas: number
}

type Recente = {
  id: number
  cliente: string
  tipo: string
  status: string
  createdAt: string
}

export default function RelatorioSolicitacoesCriadas() {
  const { statuses, getLabel: getStatusLabel, getColor: getStatusColor } = useStatuses("SOLICITACAO_DESENVOLVIMENTO")
  const [stats, setStats] = useState<Stats | null>(null)
  const [porMes, setPorMes] = useState<MesData[]>([])
  const [recentes, setRecentes] = useState<Recente[]>([])
  const [loading, setLoading] = useState(true)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (dataInicio) params.set("dataInicio", dataInicio)
    if (dataFim) params.set("dataFim", dataFim)

    fetch(`/api/relatorios/solicitacoes-criadas?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats)
        setPorMes(data.porMes || [])
        setRecentes(data.recentes || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dataInicio, dataFim])

  useEffect(() => { fetchData() }, [fetchData])

  function handleExportCSV() {
    exportCSV("solicitacoes-por-mes", ["Mês", "Criadas", "Deletadas", "Concluídas"], porMes.map((m) => [m.mes, m.criadas, m.deletadas, m.concluidas]))
    setTimeout(() => {
      exportCSV("solicitacoes-recentes", ["#", "Cliente", "Tipo", "Status", "Criado em"], recentes.map((r) => [
        r.id,
        r.cliente,
        r.tipo === "DESENVOLVIMENTO_TECELAGEM" ? "Tecelagem" : "Beneficiamento",
        getStatusLabel(r.status),
        r.createdAt ? new Date(r.createdAt).toLocaleDateString("pt-BR") : "-",
      ]))
    }, 200)
  }

  async function handleExportPDF() {
    await exportPDFRelatorio({
      title: "Relatório de Solicitações Criadas / Deletadas",
      stats: stats ? {
        "Total Criadas": stats.totalCriadas,
        "Deletadas": stats.totalDeletadas,
        "Concluídas": stats.concluidas,
        "Em Andamento": stats.emAndamento,
        "Taxa de Sucesso": `${stats.taxaSucesso}%`,
      } : undefined,
      tables: [
        { headers: ["Mês", "Criadas", "Deletadas", "Concluídas"], rows: porMes.map((m) => [m.mes, m.criadas, m.deletadas, m.concluidas]) },
        { headers: ["#", "Cliente", "Tipo", "Status", "Criado em"], rows: recentes.map((r) => [
          r.id,
          r.cliente,
          r.tipo === "DESENVOLVIMENTO_TECELAGEM" ? "Tecelagem" : "Beneficiamento",
          getStatusLabel(r.status),
          r.createdAt ? new Date(r.createdAt).toLocaleDateString("pt-BR") : "-",
        ])},
      ],
    })
  }

  const pathname = usePathname()
  const info = getInfoContent(pathname)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Relatório: Solicitações Criadas / Deletadas{info && <InfoButton content={info} />}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Acompanhe o volume de solicitações criadas, deletadas, concluídas e a taxa de sucesso
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Filter size={14} /> Filtros
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Data início</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Data fim</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
          />
        </div>
        <button
          onClick={fetchData}
          className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          Filtrar
        </button>
        <div className="flex-1" />
        <button onClick={handleExportCSV} className="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
          CSV
        </button>
        <button onClick={handleExportPDF} className="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
          PDF
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Criadas</p>
            <p className="text-3xl font-bold text-slate-700 dark:text-slate-200 mt-1">{stats.totalCriadas}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-red-50 dark:bg-red-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Deletadas</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.totalDeletadas}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-green-50 dark:bg-green-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Concluídas</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.concluidas}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-amber-50 dark:bg-amber-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Em Andamento</p>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.emAndamento}</p>
          </div>
          <div className={`rounded-xl border p-4 ${
            stats.taxaSucesso >= 70
              ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/50"
              : stats.taxaSucesso >= 40
              ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50"
              : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50"
          }`}>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Taxa de Sucesso</p>
            <p className={`text-3xl font-bold mt-1 ${
              stats.taxaSucesso >= 70
                ? "text-green-600 dark:text-green-400"
                : stats.taxaSucesso >= 40
                ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400"
            }`}>{stats.taxaSucesso}%</p>
          </div>
        </div>
      )}

      {/* Monthly chart */}
      {porMes.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            <BarChart3 size={16} className="inline mr-1" /> Por Mês
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="criadas" name="Criadas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deletadas" name="Deletadas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="concluidas" name="Concluídas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Solicitações Recentes</h3>
        </div>
        {loading ? (
          <div className="text-center py-8 text-slate-500">Carregando...</div>
        ) : recentes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma solicitação encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">#</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Cliente</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Tipo</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {recentes.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">#{r.id}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{r.cliente}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{r.tipo === "DESENVOLVIMENTO_TECELAGEM" ? "Tecelagem" : "Beneficiamento"}</td>
                    <td className="p-3">
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: hexToRgba(getStatusColor(r.status), 0.12), color: getStatusColor(r.status) }}
                      >
                        {getStatusLabel(r.status)}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-xs">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString("pt-BR") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
