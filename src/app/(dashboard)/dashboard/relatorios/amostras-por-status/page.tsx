"use client"

import { useCallback, useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { BarChart3, Filter, ExternalLink } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { exportCSV, exportPDFRelatorio } from "@/lib/export-utils"
import { useStatuses, hexToRgba } from "@/hooks/use-statuses"

type Stats = {
  total: number
  tecidoCru: number
  acabamento: number
}

type MesData = {
  mes: string
  total: number
}

type AmostraItem = {
  id: number
  tipoAmostra: string
  descricao: string | null
  status: string
  produtoCodigo: string
  produtoDescricao: string
  data: string | null
  createdAt: string | null
}

export default function RelatorioAmostrasPorStatus() {
  const { statuses, getLabel: getStatusLabel, getColor: getStatusColor } = useStatuses("AMOSTRA")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [stats, setStats] = useState<Stats | null>(null)
  const [porMes, setPorMes] = useState<MesData[]>([])
  const [lista, setLista] = useState<AmostraItem[]>([])
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

    fetch(`/api/relatorios/amostras-por-status?${params}`)
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
      exportCSV(`amostras-${selectedStatus.toLowerCase()}`, ["#", "Tipo", "Produto", "Descrição", "Data", "Criado em"], lista.map((r) => [
        r.id,
        r.tipoAmostra === "TECIDO_CRU" ? "Cru" : "Acab.",
        r.produtoCodigo,
        r.descricao || "-",
        r.data ? new Date(r.data).toLocaleDateString("pt-BR") : "-",
        r.createdAt ? new Date(r.createdAt).toLocaleDateString("pt-BR") : "-",
      ]))
    }, 200)
  }

  async function handleExportPDF() {
    const rotulo = getStatusLabel(selectedStatus)
    await exportPDFRelatorio({
      title: `Relatório: Amostras ${rotulo}`,
      stats: stats ? {
        "Total": stats.total,
        "Tecido Cru": stats.tecidoCru,
        "Acabamento": stats.acabamento,
      } : undefined,
      tables: [
        { headers: ["Mês", "Total"], rows: porMes.map((m) => [m.mes, m.total]) },
        { headers: ["#", "Tipo", "Produto", "Descrição", "Data", "Criado em"], rows: lista.map((r) => [
          r.id,
          r.tipoAmostra === "TECIDO_CRU" ? "Cru" : "Acab.",
          r.produtoCodigo,
          r.descricao || "-",
          r.data ? new Date(r.data).toLocaleDateString("pt-BR") : "-",
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Relatório: Amostras por Status{info && <InfoButton content={info} />}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Filtre amostras por status — total, tipo e detalhamento
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
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tecido Cru</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.tecidoCru}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-purple-50 dark:bg-purple-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Acabamento</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.acabamento}</p>
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
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name={getStatusLabel(selectedStatus)} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Amostras {getStatusLabel(selectedStatus)}
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
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma amostra encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">#</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Tipo</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Produto</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Descrição</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Data</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((r) => (
                  <tr key={`${r.tipoAmostra}-${r.id}`} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">#{r.id}</td>
                    <td className="p-3">
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: r.tipoAmostra === "TECIDO_CRU" ? hexToRgba("#3b82f6", 0.12) : hexToRgba("#a855f7", 0.12),
                          color: r.tipoAmostra === "TECIDO_CRU" ? "#3b82f6" : "#a855f7",
                        }}
                      >
                        {r.tipoAmostra === "TECIDO_CRU" ? "Cru" : "Acab."}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{r.produtoCodigo}</div>
                      <div className="text-xs text-slate-400 line-clamp-1">{r.produtoDescricao}</div>
                    </td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                      {r.descricao || <span className="text-slate-300 italic">Sem descrição</span>}
                    </td>
                    <td className="p-3 text-xs text-slate-500">
                      {r.data ? new Date(r.data).toLocaleDateString("pt-BR") : "-"}
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
