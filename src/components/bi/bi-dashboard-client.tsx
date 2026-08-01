"use client"

import { useState, useEffect, useCallback } from "react"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Search,Upload, BarChart3, TrendingUp, MapPin, Package, ShoppingCart, Layers, Users, AlertTriangle, Trophy, Medal, UserCheck, CalendarClock } from "lucide-react"
import { ChartCard } from "@/components/ui/chart-card"
import { ChartTooltip } from "@/components/ui/chart-tooltip"

// --- Stat Card Component ---
function StatCard({ label, value, icon: Icon, prefix = "" }: { label: string; value: string | number; icon: any; prefix?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 card-hover">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {prefix}{typeof value === "number" ? value.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : value}
          </p>
        </div>
      </div>
    </div>
  )
}

const COLORS = ["#6366f1", "#06b6d4", "#f97316", "#22c55e", "#ef4444", "#a855f7", "#eab308", "#14b8a6", "#f43f5e", "#3b82f6", "#8b5cf6", "#ec4899"]

function ClientesTable({ clientes }: { clientes: any[] }) {
  if (clientes.length === 0) {
    return <p className="text-sm text-slate-500 py-4 text-center">Nenhum cliente encontrado.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className="text-left py-2 px-2 font-medium text-slate-500">Cliente</th>
            <th className="text-left py-2 px-2 font-medium text-slate-500">Cidade/UF</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Última Compra</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Total Faturado</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Ticket Médio</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Quantidade</th>
            <th className="text-left py-2 px-2 font-medium text-slate-500">Última NF</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c, i) => (
            <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="py-2 px-2 font-medium text-slate-800 dark:text-slate-200">{c.razaoSocial}</td>
              <td className="py-2 px-2 text-slate-500">{c.cidade}/{c.uf}</td>
              <td className="py-2 px-2 text-right text-slate-700 dark:text-slate-300">
                {c.ultimaData ? new Date(c.ultimaData).toLocaleDateString("pt-BR") : "—"}
              </td>
              <td className="py-2 px-2 text-right font-medium text-slate-800 dark:text-slate-200">
                R$ {c.totalFaturado.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-2 text-right text-slate-500">
                R$ {c.ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-2 text-right text-slate-500">
                {c.quantidadeTotal.toLocaleString("pt-BR")}
              </td>
              <td className="py-2 px-2 text-slate-500">{c.ultimaNF}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RankList({ items, metric, format }: { items: any[]; metric: "totalVendas" | "totalQtd"; format: (v: number) => string }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={it.nome} className="flex items-center gap-2 text-xs">
          <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
            i === 0
              ? "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
              : "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
          }`}>
            {i + 1}
          </span>
          <span className="flex-1 truncate text-slate-700 dark:text-slate-300">{it.nome}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{format(it[metric])}</span>
        </div>
      ))}
    </div>
  )
}

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
          {clientes.map((c, i) => (
            <tr
              key={i}
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

// --- Main Dashboard Component ---
export function BiDashboardClient() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [sheetData, setSheetData] = useState<any>(null)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"dashboard" | "produto" | "grupo" | "representantes" | "clientes">("dashboard")
  const [searchProduto, setSearchProduto] = useState("")
  const [produtoList, setProdutoList] = useState<string[]>([])
  const [selectedProduto, setSelectedProduto] = useState("")
  const [searchGrupo, setSearchGrupo] = useState("")
  const [grupoList, setGrupoList] = useState<string[]>([])
  const [selectedGrupo, setSelectedGrupo] = useState("")
  const [grupoReps, setGrupoReps] = useState<any[]>([])
  const [filtroClientes, setFiltroClientes] = useState<"todos" | "alerta">("todos")
  const [clientesData, setClientesData] = useState<any[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [sheetId, setSheetId] = useState("")
  const [ttlMinutos, setTtlMinutos] = useState<number | null>(null)
  const [ttlLoading, setTtlLoading] = useState(false)
  const [configMsg, setConfigMsg] = useState("")
  const [dataInicial, setDataInicial] = useState("")
  const [dataFinal, setDataFinal] = useState("")

  // Load cached sheet on mount
  useEffect(() => {
    const cached = localStorage.getItem("bi_last_sheet")
    if (cached) {
      const parsed = JSON.parse(cached)
      setSheetId(parsed.id)
      setUrl(parsed.url)
      fetchSheetData(parsed.id)
    }
    fetch("/api/bi/config")
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.ttlMinutos) setTtlMinutos(d.ttlMinutos) })
      .catch(() => {})
  }, [])

  const fetchSheetData = useCallback(async (id: string, period?: { de?: string; ate?: string }) => {
    setLoading(true)
    setError("")
    try {
      const qs = new URLSearchParams()
      if (period?.de) qs.set("de", period.de)
      if (period?.ate) qs.set("ate", period.ate)
      const query = qs.toString() ? `?${qs}` : ""
      const res = await fetch(`/api/bi/${id}${query}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao carregar dados")
      }
      const data = await res.json()
      setSheetData(data)
      setProdutoList(data.produtos || [])
      setGrupoList(data.grupos || [])
      setSheetId(id)
    } catch (e: any) {
      setError(e.message)
      setSheetData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const periodQs = () => {
    const p = new URLSearchParams()
    if (dataInicial) p.set("de", dataInicial)
    if (dataFinal) p.set("ate", dataFinal)
    const s = p.toString()
    return s ? `?${s}` : ""
  }

  const toInputDate = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  const applyPeriod = (de: string | null, ate: string | null) => {
    setDataInicial(de || "")
    setDataFinal(ate || "")
    if (sheetId) fetchSheetData(sheetId, { de: de || undefined, ate: ate || undefined })
  }

  const presets = [
    {
      label: "Hoje",
      range: () => {
        const now = new Date()
        return { de: toInputDate(now), ate: toInputDate(now) }
      },
    },
    {
      label: "Ontem",
      range: () => {
        const ontem = new Date()
        ontem.setDate(ontem.getDate() - 1)
        return { de: toInputDate(ontem), ate: toInputDate(ontem) }
      },
    },
    {
      label: "Semana",
      range: () => {
        const now = new Date()
        const de = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        return { de: toInputDate(de), ate: toInputDate(now) }
      },
    },
    {
      label: "Quinzena",
      range: () => {
        const now = new Date()
        const de = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15)
        return { de: toInputDate(de), ate: toInputDate(now) }
      },
    },
    {
      label: "Mês atual",
      range: () => {
        const now = new Date()
        const de = new Date(now.getFullYear(), now.getMonth(), 1)
        return { de: toInputDate(de), ate: toInputDate(now) }
      },
    },
    {
      label: "Mês passado",
      range: () => {
        const now = new Date()
        const de = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const ate = new Date(now.getFullYear(), now.getMonth(), 0)
        return { de: toInputDate(de), ate: toInputDate(ate) }
      },
    },
    {
      label: "Trimestre",
      range: () => {
        const now = new Date()
        const de = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        return { de: toInputDate(de), ate: toInputDate(now) }
      },
    },
    {
      label: "Semestre",
      range: () => {
        const now = new Date()
        const de = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
        return { de: toInputDate(de), ate: toInputDate(now) }
      },
    },
    {
      label: "12 meses",
      range: () => {
        const now = new Date()
        const de = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate())
        return { de: toInputDate(de), ate: toInputDate(now) }
      },
    },
  ]

  const handleLoad = async (force = false) => {
    if (!url.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/bi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), force }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao carregar planilha")
      }
      const data = await res.json()
      localStorage.setItem("bi_last_sheet", JSON.stringify({ id: data.id, url: url.trim() }))
      await fetchSheetData(data.id, { de: dataInicial || undefined, ate: dataFinal || undefined })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTtl = async () => {
    if (ttlMinutos === null || !Number.isFinite(ttlMinutos) || ttlMinutos < 1 || ttlMinutos > 1440) {
      setConfigMsg("Valor inválido (1–1440 min)")
      return
    }
    setTtlLoading(true)
    setConfigMsg("")
    try {
      const res = await fetch("/api/bi/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttlMinutos }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar configuração")
      setTtlMinutos(data.ttlMinutos)
      setConfigMsg("Salvo!")
    } catch (e: any) {
      setConfigMsg(e.message)
    } finally {
      setTtlLoading(false)
    }
  }

  const handleSelectProduto = async (produto: string) => {
    setSelectedProduto(produto)
    if (!produto || !sheetId) return
    setLoadingClientes(true)
    try {
      const res = await fetch(`/api/bi/${sheetId}/produto/${encodeURIComponent(produto)}/clientes${periodQs()}`)
      if (!res.ok) throw new Error("Erro ao buscar clientes")
      const data = await res.json()
      setClientesData(data.clientes || [])
    } catch (e: any) {
      setError(e.message)
      setClientesData([])
    } finally {
      setLoadingClientes(false)
    }
  }

  const handleSelectGrupo = async (grupo: string) => {
    setSelectedGrupo(grupo)
    if (!grupo || !sheetId) return
    setLoadingClientes(true)
    try {
      const res = await fetch(`/api/bi/${sheetId}/grupo/${encodeURIComponent(grupo)}/clientes${periodQs()}`)
      if (!res.ok) throw new Error("Erro ao buscar clientes")
      const data = await res.json()
      setClientesData(data.clientes || [])
      setGrupoReps(data.representantes || [])
    } catch (e: any) {
      setError(e.message)
      setClientesData([])
      setGrupoReps([])
    } finally {
      setLoadingClientes(false)
    }
  }

  const filteredProdutos = produtoList.filter(p =>
    p.toLowerCase().includes(searchProduto.toLowerCase()),
  )

  const filteredGrupos = grupoList.filter(g =>
    g.toLowerCase().includes(searchGrupo.toLowerCase()),
  )

  // --- Loading State ---
  if (loading && !sheetData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-slate-500">Carregando dados da planilha...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          URL da Planilha Google
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={e => e.key === "Enter" && handleLoad()}
          />
          <button
            onClick={() => handleLoad()}
            disabled={loading || !url.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            {loading ? "Carregando..." : "Carregar"}
          </button>
          {sheetData && (
            <button
              onClick={() => handleLoad(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Recarregando..." : "Recarregar agora"}
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">
            Atualizar dados a cada
          </label>
          <input
            type="number"
            min={1}
            max={1440}
            value={ttlMinutos ?? ""}
            onChange={e => setTtlMinutos(e.target.value === "" ? null : Number(e.target.value))}
            className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">min</span>
          <button
            onClick={handleSaveTtl}
            disabled={ttlLoading}
            className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {ttlLoading ? "Salvando..." : "Salvar"}
          </button>
          {configMsg && <span className="text-xs text-slate-500 dark:text-slate-400">{configMsg}</span>}
        </div>
      </div>

      {/* Period Selector */}
      {sheetData && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mr-1">Período:</span>
            <input
              type="date"
              value={dataInicial}
              onChange={e => applyPeriod(e.target.value || null, dataFinal || null)}
              className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-500">até</span>
            <input
              type="date"
              value={dataFinal}
              onChange={e => applyPeriod(dataInicial || null, e.target.value || null)}
              className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {(dataInicial || dataFinal) && (
              <button
                onClick={() => applyPeriod(null, null)}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {presets.map(p => (
              <button
                key={p.label}
                onClick={() => {
                  const r = p.range()
                  applyPeriod(r.de, r.ate)
                }}
                className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {p.label}
              </button>
            ))}
            {(dataInicial || dataFinal) && (
              <span className="text-xs text-slate-400 ml-auto">
                Análise: {dataInicial || "início"} até {dataFinal || "hoje"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      {sheetData && (
        <>
          <div className="flex gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "dashboard"
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("representantes")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "representantes"
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Representantes
            </button>
            <button
              onClick={() => setActiveTab("clientes")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "clientes"
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <UserCheck className="w-4 h-4 inline mr-2" />
              Clientes
            </button>
            <button
              onClick={() => setActiveTab("produto")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "produto"
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Consulta por Produto
            </button>
            <button
              onClick={() => setActiveTab("grupo")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "grupo"
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Layers className="w-4 h-4 inline mr-2" />
              Consulta por Artigo
            </button>
          </div>

          {/* Sheet Info */}
          <div className="text-xs text-slate-400 dark:text-slate-500">
            {sheetData.title} &middot; {sheetData.tabs?.length || 0} aba(s) &middot;
            Relacionamentos: {sheetData.relationships?.length || 0}
          </div>

          {activeTab === "dashboard" && (
            <>
              {/* Metric Cards */}
              {sheetData.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <StatCard label="Faturamento Total" value={sheetData.metrics.totalVendas} icon={TrendingUp} prefix="R$ " />
                  <StatCard label="Representantes" value={sheetData.metrics.totalRepresentantes} icon={Layers} />
                  <StatCard label="Clientes Atendidos" value={sheetData.metrics.totalClientes} icon={ShoppingCart} />
                  <StatCard label="Linhas (Itens)" value={sheetData.metrics.totalLinhas} icon={BarChart3} />
                  <StatCard label="Previsão do Mês" value={sheetData.previsao?.projecaoMes ?? 0} icon={CalendarClock} prefix="R$ " />
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Revenue by Rep */}
                <ChartCard title="Faturamento por Representante" delay={0}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={(sheetData.revenueByRep || []).slice(0, 15)}
                      layout="vertical"
                      margin={{ left: 20, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis dataKey="nome" type="category" tick={{ fontSize: 10 }} stroke="#94a3b8" width={180} />
                      <Tooltip content={<ChartTooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`} />} />
                      <Bar dataKey="valor" radius={[0, 4, 4, 0]} animationDuration={1800}>
                        {(sheetData.revenueByRep || []).map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Monthly Trend */}
                <ChartCard title="Evolução Mensal do Faturamento" delay={200}>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={sheetData.monthlyTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip content={<ChartTooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`} />} />
                      <Line type="monotone" dataKey="valor" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* ABC Curve */}
                <ChartCard title="Curva ABC - Artigos" delay={400}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={(sheetData.abcCurve || []).slice(0, 20)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="grupo" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip content={<ChartTooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`} />} />
                      <Bar dataKey="valorTotal" radius={[4, 4, 0, 0]} animationDuration={1800} animationBegin={600}>
                        {(sheetData.abcCurve || []).map((item: any) => (
                          <Cell key={item.grupo} fill={item.classe === "A" ? "#ef4444" : item.classe === "B" ? "#f97316" : "#22c55e"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Geo Distribution */}
                <ChartCard title="Distribuição Geográfica (UF)" delay={600}>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={(sheetData.geoDistribution || []).slice(0, 10)}
                        dataKey="valor"
                        nameKey="uf"
                        cx="50%" cy="50%"
                        outerRadius={100}
                        label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                        animationDuration={2500}
                        animationBegin={800}
                      >
                        {(sheetData.geoDistribution || []).slice(0, 10).map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Previsões */}
                <ChartCard title="Previsão e Projeções" delay={800}>
                  <div className="space-y-3 p-1">
                    {(() => {
                      const p = sheetData.previsao || {}
                      const itens = [
                        { label: "Média diária no período", value: p.mediaDiaria ?? 0, money: true },
                        { label: "Projeção do mês atual", value: p.projecaoMes ?? 0, money: true },
                        { label: "Projeção próximos 30 dias", value: p.projecaoProximos30 ?? 0, money: true },
                        { label: "Projeção próximo mês (média 3m)", value: p.projecaoProximoMes ?? 0, money: true },
                        { label: "Dias cobertos pelos dados", value: p.diasCobertos ?? 0, money: false },
                      ]
                      return itens.map(x => (
                        <div key={x.label} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-800 last:border-0 pb-2 last:pb-0">
                          <span className="text-slate-500 dark:text-slate-400">{x.label}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {x.money
                              ? `R$ ${x.value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
                              : x.value.toLocaleString("pt-BR")}
                          </span>
                        </div>
                      ))
                    })()}
                  </div>
                </ChartCard>
              </div>
            </>
          )}

          {activeTab === "representantes" && (() => {
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
          })()}

          {activeTab === "clientes" && (() => {
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
                        {alertas.slice(0, 8).map((c: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs">
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
          })()}

          {activeTab === "produto" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Product Selector */}
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
                        onClick={() => handleSelectProduto(p)}
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

              {/* Client Results */}
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

                {/* Mini chart for selected product */}
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
          )}

          {activeTab === "grupo" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Group Selector */}
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
                        onClick={() => handleSelectGrupo(g)}
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

              {/* Client Results */}
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

                {/* Top representantes do artigo */}
                {selectedGrupo && !loadingClientes && grupoReps.length > 0 && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      <Users className="w-4 h-4 text-indigo-500" />
                      Top Representantes do Artigo
                    </h3>
                    <RankList items={grupoReps.slice(0, 5)} metric="totalVendas" format={(v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`} />
                  </div>
                )}

                {/* Mini chart for selected group */}
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
          )}
        </>
      )}
    </div>
  )
}
