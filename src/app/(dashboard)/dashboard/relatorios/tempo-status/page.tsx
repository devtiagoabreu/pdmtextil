"use client"

import { useCallback, useEffect, useState } from "react"
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Clock, Filter } from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { exportCSV, exportPDFRelatorio } from "@/lib/export-utils"
import { useStatuses, hexToRgba } from "@/hooks/use-statuses"

const TIPO_LABELS: Record<string, string> = {
  DESENVOLVIMENTO_TECELAGEM: "Tecelagem",
  DESENVOLVIMENTO_BENEFICIAMENTO: "Beneficiamento",
}

type TimelineEntry = {
  status: string
  statusLabel: string
  entrada: string
  saida: string | null
  duracaoMs: number
  duracaoLabel: string
}

type Resultado = {
  id: number
  cliente: string
  tipo: string
  statusAtual: string
  statusAtualLabel: string
  criadoEm: string | null
  concluidoEm: string | null
  tempoTotalLabel: string
  tempoTotalHoras: number
  trocasStatus: number
  timeline: TimelineEntry[]
}

export default function RelatorioTempoStatus() {
  const { statuses, getLabel: getStatusLabel, getColor: getStatusColor } = useStatuses("SOLICITACAO_DESENVOLVIMENTO")
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<number | null>(null)
  const [filtroStatus, setFiltroStatus] = useState("")
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim, setFiltroDataFim] = useState("")

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtroStatus) params.set("status", filtroStatus)
    if (filtroDataInicio) params.set("dataInicio", filtroDataInicio)
    if (filtroDataFim) params.set("dataFim", filtroDataFim)

    fetch(`/api/relatorios/tempo-status?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setResultados(data.resultados || [])
        setStats(data.stats)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filtroStatus, filtroDataInicio, filtroDataFim])

  useEffect(() => { fetchData() }, [fetchData])

  function handleExportCSV() {
    const rows = resultados.flatMap((r) =>
      r.timeline.map((t) => [
        `#${r.id}`,
        r.cliente,
        r.statusAtualLabel,
        t.statusLabel,
        t.entrada ? new Date(t.entrada).toLocaleString("pt-BR") : "-",
        t.saida ? new Date(t.saida).toLocaleString("pt-BR") : "Em andamento",
        t.duracaoLabel,
      ])
    )
    exportCSV("tempo-status", ["Solicitação", "Cliente", "Status Atual", "Status", "Entrada", "Saída", "Duração"], rows)
    setTimeout(() => {
      exportCSV("tempo-status-resumo", ["#", "Cliente", "Status", "Tempo Total", "Trocas"], resultados.map((r) => [
        r.id,
        r.cliente,
        r.statusAtualLabel,
        r.tempoTotalLabel,
        r.trocasStatus,
      ]))
    }, 200)
  }

  async function handleExportPDF() {
    await exportPDFRelatorio({
      title: "Relatório de Tempo em cada Status",
      stats: stats ? {
        "Total": stats.totalSolicitacoes,
        "Concluídas": stats.concluidas,
        "Tempo Médio": `${stats.tempoMedioHoras}h`,
        "Média Trocas": stats.mediaTrocasStatus,
      } : undefined,
      tables: [
        { headers: ["#", "Cliente", "Status", "Tempo Total", "Trocas"], rows: resultados.map((r) => [
          `#${r.id}`, r.cliente, r.statusAtualLabel, r.tempoTotalLabel, r.trocasStatus,
        ])},
        { headers: ["Solicitação", "Status", "Entrada", "Saída", "Duração"], rows: resultados.flatMap((r) =>
          r.timeline.map((t) => [
            `#${r.id} - ${r.cliente}`,
            t.statusLabel,
            t.entrada ? new Date(t.entrada).toLocaleString("pt-BR") : "-",
            t.saida ? new Date(t.saida).toLocaleString("pt-BR") : "Em andamento",
            t.duracaoLabel,
          ])
        )},
      ],
    })
  }

  const pathname = usePathname()
  const info = getInfoContent(pathname)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Relatório: Tempo em cada Status{info && <InfoButton content={info} />}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Acompanhe o tempo que cada solicitação permaneceu em cada status
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Filter size={14} /> Filtros
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Status</label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
          >
            <option value="">Todos</option>
            {statuses.map((st) => (
              <option key={st.nome} value={st.nome}>{st.rotulo || st.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Data início</label>
          <input
            type="date"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Data fim</label>
          <input
            type="date"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
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
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Solicitações</p>
            <p className="text-3xl font-bold text-slate-700 dark:text-slate-200 mt-1">{stats.totalSolicitacoes}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-green-50 dark:bg-green-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Concluídas</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.concluidas}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tempo Médio (horas)</p>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{stats.tempoMedioHoras}h</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-purple-50 dark:bg-purple-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Média Trocas de Status</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.mediaTrocasStatus}</p>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Carregando...</div>
        ) : resultados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhum resultado</p>
          </div>
        ) : (
          resultados.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpandido(expandido === r.id ? null : r.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">#{r.id}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">{r.cliente}</span>
                  <span className="text-xs text-slate-400">{TIPO_LABELS[r.tipo] || r.tipo}</span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium`}
                    style={{ backgroundColor: hexToRgba(getStatusColor(r.statusAtual), 0.12), color: getStatusColor(r.statusAtual) }}
                  >
                    {r.statusAtualLabel}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">{r.tempoTotalLabel}</span>
                  <span className="text-xs text-slate-400">{r.trocasStatus} trocas</span>
                  <span className="text-slate-400">{expandido === r.id ? "▲" : "▼"}</span>
                </div>
              </button>

              {/* Expanded timeline */}
              {expandido === r.id && (
                <div className="border-t border-slate-100 dark:border-slate-800 p-4">
                  {r.timeline.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhum registro de mudança de status</p>
                  ) : (
                    <div className="space-y-3">
                      {r.timeline.map((t, i) => {
                        const cor = getStatusColor(t.status)
                        const larguraPct = r.timeline.reduce((a, x) => a + x.duracaoMs, 0) > 0
                          ? (t.duracaoMs / r.timeline.reduce((a, x) => a + x.duracaoMs, 0)) * 100
                          : 0
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-36 shrink-0 text-right">
                              <span className="text-xs font-medium" style={{ color: cor }}>{t.statusLabel}</span>
                            </div>
                            <div className="flex-1 h-6 rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-md transition-all"
                                style={{
                                  width: `${Math.max(larguraPct, 2)}%`,
                                  backgroundColor: cor + "40",
                                }}
                              />
                            </div>
                            <div className="w-28 shrink-0 text-left">
                              <span className="text-xs text-slate-500">{t.duracaoLabel}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
