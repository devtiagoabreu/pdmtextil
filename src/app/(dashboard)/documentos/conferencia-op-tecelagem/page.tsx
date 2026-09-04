"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Globe, Loader2, ScanLine, Search } from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import type { GrupoOp, Integracao, ConferenciaRolo } from "./components/types"
import { buildGrupos, extractItems, normalizeRolo } from "./components/utils"
import { OpCard } from "./components/op-card"
import { Toolbar } from "./components/toolbar"

const BarcodeScanner = dynamic(() =>
  import("./components/barcode-scanner").then((m) => m.BarcodeScanner),
  { ssr: false },
)

export default function ConferenciaOpTecelagemPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [itens, setItens] = useState<ConferenciaRolo[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [expandedOp, setExpandedOp] = useState<string | null>(null)
  const [scanOpen, setScanOpen] = useState(false)
  const [ordemOp, setOrdemOp] = useState<"asc" | "desc">("desc")

  const { data: integracoesData, isLoading: loadingInt, isError: integracoesError } = useQuery<Integracao[]>({
    queryKey: ["integracao-listar", "conferencia-op-tecelagem"],
    queryFn: async () => {
      const res = await fetch("/api/integracao/listar?tela=conferencia-op-tecelagem")
      if (!res.ok) throw new Error("Erro ao carregar integrações")
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
  })
  const integracoes = integracoesData ?? []

  useEffect(() => {
    if (integracoes && integracoes.length > 0 && selectedId === null) {
      setSelectedId(integracoes[0].id)
    }
  }, [integracoes, selectedId])

  useEffect(() => {
    if (integracoesError) toast.error("Erro ao carregar integrações")
  }, [integracoesError])

  const itensFiltrados = useMemo(() => {
    if (!searchTerm) return itens
    const termo = searchTerm.trim().toLowerCase()
    return itens.filter(
      (item) =>
        String(item.op).toLowerCase().includes(termo) ||
        String(item.codigoRolo ?? "").toLowerCase().includes(termo),
    )
  }, [itens, searchTerm])

  const grupos: GrupoOp[] = useMemo(() => buildGrupos(itensFiltrados, ordemOp), [itensFiltrados, ordemOp])

  const buscar = useCallback(async () => {
    if (!selectedId) return
    setLoadingData(true)
    setItens([])
    setExpandedOp(null)
    try {
      const res = await fetch(`/api/integracao/${selectedId}/executar`)
      const data = await res.json()
      if (!data.success) {
        toast.error(`API retornou erro: ${data.status}`)
        return
      }
      const rawItems = extractItems(data.responseBody)
      if (rawItems.length === 0) {
        toast.error("Nenhum rolo encontrado")
        return
      }
      const normalizados = rawItems.map((r) => normalizeRolo(r))
      setItens(normalizados)
      const ops = [...new Set(normalizados.map((r) => r.op || "SEM OP"))]
      if (ops.length > 0) setExpandedOp(ops[0])
      toast.success(
        `${normalizados.length} rolo(s) de ${ops.length} OP(s) carregado(s)`,
      )
    } catch {
      toast.error("Erro ao buscar dados")
    } finally {
      setLoadingData(false)
    }
  }, [selectedId])

  function handleSearch() {
    const termo = searchInput.trim()
    setSearchTerm(termo)
    setExpandedOp(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch()
  }

  function handleLimparBusca() {
    setSearchInput("")
    setSearchTerm("")
    setExpandedOp(null)
  }

  function handleCarregarTodas() {
    setSearchInput("")
    setSearchTerm("")
    buscar()
  }

  function handleDetected(value: string) {
    setSearchInput(value)
    setSearchTerm(value)
    setExpandedOp(null)
    setScanOpen(false)
    toast.success(`OP ${value} detectada`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Conferência de OP de Tecelagem{info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Consulta e conferência de rolos gerados por ordem de produção (OP)
          </p>
        </div>
      </div>

      {loadingInt ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      ) : integracoes.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <Globe size={44} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Nenhuma integração configurada para conferência de OP
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre uma integração em Configurações &gt; Integrações com a tela{" "}
            &quot;conferencia-op-tecelagem&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Toolbar
            integracoes={integracoes}
            selectedId={selectedId}
            onSelectIntegracao={setSelectedId}
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            onKeyDown={handleKeyDown}
            onSearch={handleSearch}
            searchDisabled={!selectedId || loadingData || itens.length === 0}
            searchTerm={searchTerm}
            onLimparBusca={handleLimparBusca}
            onCarregarTodos={handleCarregarTodas}
            carregarTodosDisabled={!selectedId || loadingData}
            loadingData={loadingData}
            onLerCodigo={() => setScanOpen(true)}
            ordemOp={ordemOp}
            onOrdemOpChange={setOrdemOp}
            ordemEnabled={itens.length > 0}
          />

          {loadingData ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : grupos.length > 0 ? (
            <div className="space-y-3">
              {searchTerm && (
                <p className="text-xs text-slate-500">
                  Filtrando por &quot;{searchTerm}&quot; — {itensFiltrados.length} de{" "}
                  {itens.length} rolo(s)
                </p>
              )}
              <div className="space-y-6">
                {grupos.map((grupo) => (
                  <OpCard
                    key={grupo.op}
                    grupo={grupo}
                    expanded={expandedOp === grupo.op}
                    onToggleExpand={() =>
                      setExpandedOp(expandedOp === grupo.op ? null : grupo.op)
                    }
                  />
                ))}
              </div>
            </div>
          ) : itens.length === 0 && !loadingData ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
              <ScanLine size={44} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">
                Digite o número da OP ou do rolo, leia o código de barras ou clique em &quot;Carregar Todas&quot;
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Após carregar, use a busca para filtrar os rolos pela OP ou pelo número do rolo
              </p>
            </div>
          ) : itens.length > 0 && grupos.length === 0 && !loadingData ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
              <Search size={44} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">
                Nenhum resultado para &quot;{searchTerm}&quot;
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Confira se a OP ou o rolo existe na integração selecionada
              </p>
            </div>
          ) : null}
        </div>
      )}

      {scanOpen && (
        <BarcodeScanner onDetected={handleDetected} onClose={() => setScanOpen(false)} />
      )}
    </div>
  )
}
