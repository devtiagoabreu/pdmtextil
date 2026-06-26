"use client"

import { useCallback, useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { BarChart3, Filter, ExternalLink } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { exportCSV, exportPDFRelatorio, statsToHTML, tableToHTML } from "@/lib/export-utils"
import { useStatuses, hexToRgba } from "@/hooks/use-statuses"

type Stats = {
  total: number
  tecelagem: number
  beneficiamento: number
}

type MesData = {
  mes: string
  concluidas: number
}

type SolicitacaoItem = {
  id: number
  tipo: string
  cliente: string
  projeto: string | null
  status: string
  createdAt: string
  dataConclusao: string | null
  prazoDesejado: string | null
  diasEmDev: number | null
}

export default function RelatorioSolicitacoesConcluidas() {
  const { getLabel: getStatusLabel, getColor: getStatusColor } = useStatuses("SOLICITACAO_DESENVOLVIMENTO")
  const [stats, setStats] = useState<Stats | null>(null)
  const [porMes, setPorMes] = useState<MesData[]>([])
  const [lista, setLista] = useState<SolicitacaoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (dataInicio) params.set("dataInicio", dataInicio)
    if (dataFim) params.set("dataFim", dataFim)

    fetch(`/api/relatorios/solicitacoes-concluidas?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats)
        setPorMes(data.porMes || [])
        setLista(data.lista || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dataInicio, dataFim])

  useEffect(() => { fetchData() }, [fetchData])

  function handleExportCSV() {
    setTimeout(() => {
      exportCSV("concluidas-desenvolvimento", ["#", "Cliente", "Projeto", "Tipo", "Criado em", "Concluído em", "Dias em Dev"], lista.map((r) => [
        r.id,
        r.cliente,
        r.projeto || "-",
        r.tipo === "DESENVOLVIMENTO_TECELAGEM" ? "Tecelagem" : "Beneficiamento",
        r.createdAt ? new Date(r.createdAt).toLocaleDateString("pt-BR") : "-",
        r.dataConclusao ? new Date(r.dataConclusao).toLocaleDateString("pt-BR") : "-",
        r.diasEmDev !== null ? String(r.diasEmDev) : "-",
      ]))
    }, 200)
  }

  async function handleExportPDF() {
    const statsHtml = stats ? statsToHTML({
      "Total Concluídas": stats.total,
      "Tecelagem": stats.tecelagem,
      "Beneficiamento": stats.beneficiamento,
    }) : ""
    const mesTable = tableToHTML(["Mês", "Concluídas"], porMes.map((m) => [m.mes, m.concluidas]))
    const listaTable = tableToHTML(["#", "Cliente", "Projeto", "Tipo", "Criado em", "Concluído em", "Dias"], lista.map((r) => [
      r.id,
      r.cliente,
      r.projeto || "-",
      r.tipo === "DESENVOLVIMENTO_TECELAGEM" ? "Tecelagem" : "Beneficiamento",
      r.createdAt ? new Date(r.createdAt).toLocaleDateString("pt-BR") : "-",
      r.dataConclusao ? new Date(r.dataConclusao).toLocaleDateString("pt-BR") : "-",
      r.diasEmDev !== null ? String(r.diasEmDev) : "-",
    ]))
    await exportPDFRelatorio("Relatório de Solicitações Concluídas (Desenvolvimento)", statsHtml + mesTable + listaTable)
  }

  const pathname = usePathname()
  const info = getInfoContent(pathname)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Relatório: Concluídas Desenvolvimento{info && <InfoButton content={info} />}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Solicitações com status Concluído Desenvolvimento — total, distribuição por tipo e detalhamento
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-end rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Filter size={14} /> Filtros
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Data início (conclusão)</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Data fim (conclusão)</label>
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

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-green-50 dark:bg-green-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Concluídas</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tecelagem</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.tecelagem}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-purple-50 dark:bg-purple-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Beneficiamento</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.beneficiamento}</p>
          </div>
        </div>
      )}

      {porMes.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            <BarChart3 size={16} className="inline mr-1" /> Concluídas por Mês
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="concluidas" name="Concluídas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Solicitações Concluídas</h3>
        </div>
        {loading ? (
          <div className="text-center py-8 text-slate-500">Carregando...</div>
        ) : lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma solicitação concluída encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">#</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Cliente</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Tipo</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Criado em</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Concluído em</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Dias</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">#{r.id}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      <div>{r.cliente}</div>
                      {r.projeto && <div className="text-xs text-slate-400">{r.projeto}</div>}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: r.tipo === "DESENVOLVIMENTO_TECELAGEM" ? hexToRgba("#3b82f6", 0.12) : hexToRgba("#a855f7", 0.12),
                          color: r.tipo === "DESENVOLVIMENTO_TECELAGEM" ? "#3b82f6" : "#a855f7",
                        }}
                      >
                        {r.tipo === "DESENVOLVIMENTO_TECELAGEM" ? "Tecelagem" : "Beneficiamento"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-xs">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString("pt-BR") : "-"}
                    </td>
                    <td className="p-3 text-slate-500 text-xs">
                      {r.dataConclusao ? new Date(r.dataConclusao).toLocaleDateString("pt-BR") : "-"}
                    </td>
                    <td className="p-3">
                      {r.diasEmDev !== null && (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.diasEmDev <= 30
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : r.diasEmDev <= 60
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {r.diasEmDev} dias
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/comercial/solicitacoes/${r.id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink size={12} /> Abrir
                      </Link>
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
