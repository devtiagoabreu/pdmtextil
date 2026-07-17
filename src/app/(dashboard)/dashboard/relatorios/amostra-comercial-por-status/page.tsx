"use client"

import { useCallback, useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { BarChart3, Filter } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { exportCSV, exportPDFRelatorio } from "@/lib/export-utils"
import { useStatuses, hexToRgba } from "@/hooks/use-statuses"
import { ChartTooltip } from "@/components/ui/chart-tooltip"

type Stats = {
  total: number
}

type MesData = {
  mes: string
  total: number
}

type RequisicaoItem = {
  id: number
  titulo: string | null
  cliente: string | null
  produtoCodigo: string | null
  produtoDescricao: string | null
  status: string
  createdAt: string | null
}

export default function RelatorioAmostraComercialPorStatus() {
  const { statuses, getLabel: getStatusLabel, getColor: getStatusColor } = useStatuses("AMOSTRA_COMERCIAL")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [stats, setStats] = useState<Stats | null>(null)
  const [porMes, setPorMes] = useState<MesData[]>([])
  const [lista, setLista] = useState<RequisicaoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  const fetchData = useCallback(() => {
    if (!selectedStatus) return
    setLoading(true)
    const params = new URLSearchParams()
    params.set("status", selectedStatus)
    if (dataInicio) params.set("dataInicio", dataInicio)
    if (dataFim) params.set("dataFim", dataFim)

    fetch(`/api/relatorios/amostra-comercial-por-status?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats)
        setPorMes(data.porMes || [])
        setLista(data.lista || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedStatus, dataInicio, dataFim])

  useEffect(() => {
    if (selectedStatus) fetchData()
  }, [fetchData, selectedStatus])

  useEffect(() => {
    if (statuses.length > 0 && !selectedStatus) {
      setSelectedStatus(statuses[0].nome)
    }
  }, [statuses, selectedStatus])

  function handleExportCSV() {
    setTimeout(() => {
      exportCSV(`amostra-comercial-${selectedStatus.toLowerCase()}`, ["#", "Título", "Cliente", "Produto", "Criado em"], lista.map((r) => [
        r.id,
        r.titulo || "-",
        r.cliente || "-",
        r.produtoCodigo || "-",
        r.createdAt ? new Date(r.createdAt).toLocaleDateString("pt-BR") : "-",
      ]))
    }, 200)
  }

  async function handleExportPDF() {
    const rotulo = getStatusLabel(selectedStatus)
    await exportPDFRelatorio({
      title: `Relatório: Amostras Comerciais ${rotulo}`,
      stats: stats ? {
        "Total": stats.total,
      } : undefined,
      tables: [
        { headers: ["Mês", "Total"], rows: porMes.map((m) => [m.mes, m.total]) },
        { headers: ["#", "Título", "Cliente", "Produto", "Criado em"], rows: lista.map((r) => [
          r.id,
          r.titulo || "-",
          r.cliente || "-",
          r.produtoCodigo || "-",
          r.createdAt ? new Date(r.createdAt).toLocaleDateString("pt-BR") : "-",
        ])},
      ],
      orientation: "landscape",
    })
  }

  const pathname = usePathname()
  const info = getInfoContent(pathname)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Relatório: Amostras Comerciais por Status{info && <InfoButton content={info} />}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Filtre requisições de amostra comercial por status — total e detalhamento
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-end rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Filter size={14} /> Filtros
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm min-w-[200px]"
          >
            {statuses.map((s) => (
              <option key={s.nome} value={s.nome}>{s.rotulo}</option>
            ))}
          </select>
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
        {selectedStatus && (
          <>
            <button onClick={handleExportCSV} className="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
              CSV
            </button>
            <button onClick={handleExportPDF} className="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
              PDF
            </button>
          </>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total</p>
            <p className="text-3xl font-bold text-slate-700 dark:text-slate-200 mt-1">{stats.total}</p>
          </div>
        </div>
      )}

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
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="total" name={getStatusLabel(selectedStatus)} fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1000} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Requisições {getStatusLabel(selectedStatus)}
          </h3>
        </div>
        {loading ? (
          <div className="text-center py-8 text-slate-500">Carregando...</div>
        ) : !selectedStatus ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Selecione um status para visualizar</p>
          </div>
        ) : lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma requisição encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">#</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Título</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Cliente</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Produto</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">#{r.id}</td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400">{r.titulo || "—"}</td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400">{r.cliente || "—"}</td>
                    <td className="p-3">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{r.produtoCodigo || "—"}</div>
                      {r.produtoDescricao && (
                        <div className="text-xs text-slate-400 line-clamp-1">{r.produtoDescricao}</div>
                      )}
                    </td>
                    <td className="p-3 text-xs text-slate-500">
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
