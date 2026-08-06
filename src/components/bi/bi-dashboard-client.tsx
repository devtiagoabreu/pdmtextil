"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { UrlBar } from "./url-bar"
import { PeriodBar } from "./period-bar"
import { TabsNav, type BiTabId } from "./tabs-nav"
import { DashboardTab } from "./dashboard-tab"
import { RepresentantesTab } from "./representantes-tab"
import { ClientesTab } from "./clientes-tab"
import { ProdutoTab } from "./produto-tab"
import { GrupoTab } from "./grupo-tab"

export function BiDashboardClient() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<BiTabId>("dashboard")
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

  const queryClient = useQueryClient()

  const { data: sheetData, isLoading: sheetLoading, error: sheetError } = useQuery<any>({
    queryKey: ["bi-sheet", sheetId, dataInicial, dataFinal],
    queryFn: async ({ queryKey }) => {
      const [, id, de, ate] = queryKey as [string, string, string, string]
      const qs = new URLSearchParams()
      if (de) qs.set("de", de)
      if (ate) qs.set("ate", ate)
      const query = qs.toString() ? `?${qs}` : ""
      const res = await fetch(`/api/bi/${id}${query}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao carregar dados")
      }
      return res.json()
    },
    enabled: !!sheetId,
    retry: false,
  })

  const { data: biConfig } = useQuery<any>({
    queryKey: ["bi-config"],
    queryFn: async () => {
      const r = await fetch("/api/bi/config")
      return r.ok ? r.json() : null
    },
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (biConfig?.ttlMinutos) setTtlMinutos(biConfig.ttlMinutos)
  }, [biConfig])

  // Restaura a última planilha carregada
  useEffect(() => {
    const cached = localStorage.getItem("bi_last_sheet")
    if (cached) {
      const parsed = JSON.parse(cached)
      setSheetId(parsed.id)
      setUrl(parsed.url)
    }
  }, [])

  useEffect(() => {
    if (sheetError) setError((sheetError as any)?.message || "Erro ao carregar dados")
  }, [sheetError])

  useEffect(() => {
    if (sheetData) {
      setProdutoList(sheetData.produtos || [])
      setGrupoList(sheetData.grupos || [])
    }
  }, [sheetData])

  const fetchSheetData = useCallback((id: string, period?: { de?: string; ate?: string }) => {
    setDataInicial(period?.de || "")
    setDataFinal(period?.ate || "")
    setSheetId(id)
    setError("")
    queryClient.refetchQueries({ queryKey: ["bi-sheet"] })
  }, [queryClient])

  const periodQs = () => {
    const p = new URLSearchParams()
    if (dataInicial) p.set("de", dataInicial)
    if (dataFinal) p.set("ate", dataFinal)
    const s = p.toString()
    return s ? `?${s}` : ""
  }

  const applyPeriod = (de: string | null, ate: string | null) => {
    setDataInicial(de || "")
    setDataFinal(ate || "")
    if (sheetId) fetchSheetData(sheetId, { de: de || undefined, ate: ate || undefined })
  }

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

  // --- Loading State ---
  if ((loading || sheetLoading) && !sheetData) {
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
      <UrlBar
        url={url}
        setUrl={setUrl}
        onLoad={handleLoad}
        loading={loading}
        sheetLoading={sheetLoading}
        hasSheet={!!sheetData}
        error={error}
        ttlMinutos={ttlMinutos}
        setTtlMinutos={setTtlMinutos}
        ttlLoading={ttlLoading}
        onSaveTtl={handleSaveTtl}
        configMsg={configMsg}
      />

      {sheetData && (
        <PeriodBar
          dataInicial={dataInicial}
          dataFinal={dataFinal}
          onApplyPeriod={applyPeriod}
        />
      )}

      {sheetData && (
        <>
          <TabsNav activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Sheet Info */}
          <div className="text-xs text-slate-400 dark:text-slate-500">
            {sheetData.title} &middot; {sheetData.tabs?.length || 0} aba(s) &middot;
            Relacionamentos: {sheetData.relationships?.length || 0}
          </div>

          {activeTab === "dashboard" && <DashboardTab sheetData={sheetData} />}

          {activeTab === "representantes" && <RepresentantesTab sheetData={sheetData} />}

          {activeTab === "clientes" && (
            <ClientesTab sheetData={sheetData} filtroClientes={filtroClientes} setFiltroClientes={setFiltroClientes} />
          )}

          {activeTab === "produto" && (
            <ProdutoTab
              produtoList={produtoList}
              searchProduto={searchProduto}
              setSearchProduto={setSearchProduto}
              selectedProduto={selectedProduto}
              onSelectProduto={handleSelectProduto}
              clientesData={clientesData}
              loadingClientes={loadingClientes}
            />
          )}

          {activeTab === "grupo" && (
            <GrupoTab
              grupoList={grupoList}
              searchGrupo={searchGrupo}
              setSearchGrupo={setSearchGrupo}
              selectedGrupo={selectedGrupo}
              onSelectGrupo={handleSelectGrupo}
              clientesData={clientesData}
              grupoReps={grupoReps}
              loadingClientes={loadingClientes}
            />
          )}
        </>
      )}
    </div>
  )
}
