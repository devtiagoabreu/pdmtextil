"use client"

import { useEffect, useState } from "react"
import { Clock, FlaskConical } from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
}

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: "#eab308",
  APROVADO: "#22c55e",
  REPROVADO: "#ef4444",
}

type TimelineEntry = {
  status: string
  statusLabel: string
  entrada: string
  saida: string | null
  duracaoMs: number
  duracaoLabel: string
}

type AmostraReport = {
  id: number
  descricao: string
  statusAtual: string
  statusLabel: string
  produtoCodigo: string
  produtoDescricao: string
  acabamentoDescricao: string | null
  tipoAmostra: string
  criadoEm: string | null
  tempoTotalLabel: string
  tempoTotalMs: number
  trocasStatus: number
  timeline: TimelineEntry[]
}

export default function RelatorioTempoStatusAmostras() {
  const [tecidoCru, setTecidoCru] = useState<AmostraReport[]>([])
  const [acabamento, setAcabamento] = useState<AmostraReport[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [aba, setAba] = useState<"tecidoCru" | "acabamento">("tecidoCru")

  useEffect(() => {
    fetch("/api/relatorios/tempo-status-amostras")
      .then((r) => r.json())
      .then((data) => {
        setTecidoCru(data.tecidoCru || [])
        setAcabamento(data.acabamento || [])
        setStats(data.stats)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const lista = aba === "tecidoCru" ? tecidoCru : acabamento

  const pathname = usePathname()
  const info = getInfoContent(pathname)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Relatório: Amostras - Tempo em cada Status{info && <InfoButton content={info} />}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Histórico de status de todas as amostras do sistema
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Amostras</p>
            <p className="text-3xl font-bold text-slate-700 dark:text-slate-200 mt-1">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-cyan-50 dark:bg-cyan-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tecido Cru</p>
            <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">{stats.totalTecidoCru}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-orange-50 dark:bg-orange-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Acabamento</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.totalAcabamento}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-yellow-50 dark:bg-yellow-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pendentes</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pendentes}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-green-50 dark:bg-green-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Aprovadas</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.aprovadas}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setAba("tecidoCru")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            aba === "tecidoCru"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <FlaskConical size={16} />
          Tecido Cru
          <span className="text-xs bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">{tecidoCru.length}</span>
        </button>
        <button
          onClick={() => setAba("acabamento")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            aba === "acabamento"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <FlaskConical size={16} />
          Acabamento
          <span className="text-xs bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">{acabamento.length}</span>
        </button>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Carregando...</div>
        ) : lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma amostra encontrada</p>
          </div>
        ) : (
          lista.map((r, i) => {
            const key = `${r.tipoAmostra}-${r.id}-${i}`
            return (
              <div key={key} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpandido(expandido === key ? null : key)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {r.produtoCodigo}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{r.descricao || r.produtoDescricao}</p>
                    </div>
                    {r.acabamentoDescricao && (
                      <span className="text-xs text-slate-400 shrink-0">({r.acabamentoDescricao})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm shrink-0">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: STATUS_COLORS[r.statusAtual] + "20", color: STATUS_COLORS[r.statusAtual] }}
                    >
                      {r.statusLabel}
                    </span>
                    <span className="text-slate-500">{r.tempoTotalLabel}</span>
                    <span className="text-xs text-slate-400">{r.trocasStatus} trocas</span>
                    <span className="text-slate-400">{expandido === key ? "▲" : "▼"}</span>
                  </div>
                </button>

                {/* Expanded timeline */}
                {expandido === key && (
                  <div className="border-t border-slate-100 dark:border-slate-800 p-4">
                    {r.timeline.length === 0 ? (
                      <p className="text-sm text-slate-500">Nenhum registro de mudança de status</p>
                    ) : (
                      <div className="space-y-3">
                        {r.timeline.length > 0 && (
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-xs text-slate-400 w-24 shrink-0 text-right">Tempo total:</span>
                            <span className="text-sm font-medium">{r.tempoTotalLabel}</span>
                          </div>
                        )}
                        {r.timeline.map((t, ti) => {
                          const cor = STATUS_COLORS[t.status] || "#94a3b8"
                          const totalMs = r.timeline.reduce((a, x) => a + x.duracaoMs, 0)
                          const larguraPct = totalMs > 0 ? (t.duracaoMs / totalMs) * 100 : 0
                          return (
                            <div key={ti} className="flex items-center gap-3">
                              <div className="w-24 shrink-0 text-right">
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
                              <div className="w-24 shrink-0 text-left">
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
            )
          })
        )}
      </div>
    </div>
  )
}
