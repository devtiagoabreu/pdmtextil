"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Globe, Loader2, Search, Truck } from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import type { GrupoRomaneio, Integracao, OrientacaoPdf, Rolo } from "./components/types"
import { gerarPdfRomaneio, gerarPdfRomaneioConsolidado } from "./components/romaneio-pdf"
import { RomaneioCard } from "./components/romaneio-card"
import { Toolbar } from "./components/toolbar"

export default function RomaneiosPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [itens, setItens] = useState<Rolo[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [expandedRomaneio, setExpandedRomaneio] = useState<number | null>(null)
  const [selectedRomaneios, setSelectedRomaneios] = useState<Set<number>>(new Set())
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [orientacaoPdf, setOrientacaoPdf] = useState<OrientacaoPdf>("portrait")

  const { data: integracoesData, isLoading: loadingInt, isError: integracoesError } = useQuery<Integracao[]>({
    queryKey: ["integracao-listar", "romaneios"],
    queryFn: async () => {
      const res = await fetch("/api/integracao/listar?tela=romaneios")
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
    const termo = searchTerm.toLowerCase()
    return itens.filter(
      (item) =>
        String(item.pedido).includes(termo) ||
        String(item.romaneio).includes(termo),
    )
  }, [itens, searchTerm])

  const grupos = useMemo(() => {
    const map = new Map<number, GrupoRomaneio>()
    for (const item of itensFiltrados) {
      let grupo = map.get(item.romaneio)
      if (!grupo) {
        grupo = {
          romaneio: item.romaneio,
          capa: item,
          rolos: [],
          totalRolos: 0,
          totalMetragem: 0,
          totalPesoBruto: 0,
          totalPesoLiquido: 0,
        }
        map.set(item.romaneio, grupo)
      }
      grupo.rolos.push(item)
      grupo.totalRolos++
      grupo.totalMetragem += item.quantidade || 0
      grupo.totalPesoBruto += item.peso_bruto || 0
      grupo.totalPesoLiquido += item.peso_liquido || 0
    }
    return Array.from(map.values()).sort((a: any, b: any) => b.romaneio - a.romaneio)
  }, [itensFiltrados])

  const buscar = useCallback(async (search?: string) => {
    if (!selectedId) return
    setLoadingData(true)
    setItens([])
    setExpandedRomaneio(null)
    setSelectedRomaneios(new Set())
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const qs = params.toString()
      const res = await fetch(`/api/integracao/${selectedId}/executar${qs ? `?${qs}` : ""}`)
      const data = await res.json()
      if (!data.success) {
        toast.error(`API retornou erro: ${data.status}`)
        return
      }
      const body = data.responseBody
      const rawItems = body?.items || (Array.isArray(body) ? body : body?.data || [])
      if (!Array.isArray(rawItems) || rawItems.length === 0) {
        toast.error("Nenhum romaneio encontrado")
        return
      }
      setItens(rawItems as Rolo[])
      const romaneios = [...new Set(rawItems.map((r: Rolo) => r.romaneio))]
      if (romaneios.length > 0) setExpandedRomaneio(romaneios[0])
      toast.success(`${rawItems.length} rolo(s) de ${romaneios.length} romaneio(s) carregado(s)`)
    } catch {
      toast.error("Erro ao buscar dados")
    } finally {
      setLoadingData(false)
    }
  }, [selectedId])

  function handleSearch() {
    const termo = searchInput.trim()
    setSearchTerm(termo)
    setExpandedRomaneio(null)
    setSelectedRomaneios(new Set())
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch()
  }

  function handleLimparBusca() {
    setSearchInput("")
    setSearchTerm("")
    setExpandedRomaneio(null)
    setSelectedRomaneios(new Set())
  }

  function handleCarregarTodos() {
    setSearchInput("")
    setSearchTerm("")
    buscar()
  }

  function toggleRomaneio(numero: number) {
    setSelectedRomaneios((prev) => {
      const next = new Set(prev)
      if (next.has(numero)) next.delete(numero)
      else next.add(numero)
      return next
    })
  }

  async function gerarPdf(numero: number, orientacao?: OrientacaoPdf) {
    const grupo = grupos.find((g: any) => g.romaneio === numero)
    if (!grupo) return

    setGerandoPdf(true)
    try {
      await gerarPdfRomaneio(grupo, orientacao || orientacaoPdf)
      toast.success(`PDF do romaneio ${numero} gerado!`)
    } catch (err) {
      toast.error("Erro ao gerar PDF: " + (err instanceof Error ? err.message : "desconhecido"))
    } finally {
      setGerandoPdf(false)
    }
  }

  async function gerarPdfConsolidado() {
    if (selectedRomaneios.size === 0) {
      toast.error("Selecione ao menos um romaneio")
      return
    }

    setGerandoPdf(true)
    try {
      const nums = Array.from(selectedRomaneios).sort((a: any, b: any) => a - b)
      await gerarPdfRomaneioConsolidado(grupos, nums, orientacaoPdf)
      toast.success(`PDF consolidado com ${nums.length} romaneio(s) gerado!`)
    } catch (err) {
      toast.error("Erro ao gerar PDF consolidado: " + (err instanceof Error ? err.message : "desconhecido"))
    } finally {
      setGerandoPdf(false)
    }
  }

  async function gerarPdfsSelecionados() {
    if (selectedRomaneios.size === 0) {
      toast.error("Selecione ao menos um romaneio")
      return
    }
    setGerandoPdf(true)
    for (const num of selectedRomaneios) {
      await gerarPdf(num)
    }
    setGerandoPdf(false)
    toast.success(`${selectedRomaneios.size} PDF(s) gerados!`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Romaneios de Expedição{info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Consulta, conferência e impressão de romaneios de carga
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
            Nenhuma integração configurada para romaneios
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre uma integração em Configurações &gt; Integrações com a tela &quot;romaneios&quot;
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
            onCarregarTodos={handleCarregarTodos}
            carregarTodosDisabled={!selectedId || loadingData}
            loadingData={loadingData}
            orientacaoPdf={orientacaoPdf}
            onToggleOrientacao={() =>
              setOrientacaoPdf(orientacaoPdf === "portrait" ? "landscape" : "portrait")
            }
            showPdfButtons={grupos.length > 0}
            selectedCount={selectedRomaneios.size}
            gerandoPdf={gerandoPdf}
            onGerarPdfsSelecionados={gerarPdfsSelecionados}
            onGerarPdfConsolidado={gerarPdfConsolidado}
          />

          {loadingData ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : grupos.length > 0 ? (
            <div className="space-y-3">
              {searchTerm && (
                <p className="text-xs text-slate-500">
                  Filtrando por &quot;{searchTerm}&quot; — {itensFiltrados.length} de {itens.length} rolo(s)
                </p>
              )}
              <div className="space-y-6">
                {grupos.map((grupo: any) => (
                  <RomaneioCard
                    key={grupo.romaneio}
                    grupo={grupo}
                    selected={selectedRomaneios.has(grupo.romaneio)}
                    expanded={expandedRomaneio === grupo.romaneio}
                    gerandoPdf={gerandoPdf}
                    onToggle={() => toggleRomaneio(grupo.romaneio)}
                    onToggleExpand={() =>
                      setExpandedRomaneio(
                        expandedRomaneio === grupo.romaneio ? null : grupo.romaneio,
                      )
                    }
                    onGerarPdf={() => gerarPdf(grupo.romaneio)}
                  />
                ))}
              </div>
            </div>
          ) : itens.length === 0 && !loadingData ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
              <Truck size={44} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">
                Digite um número de pedido ou romaneio e clique em &quot;Buscar&quot;
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Ou clique em &quot;Carregar Todos&quot; para listar todos os romaneios
              </p>
            </div>
          ) : itens.length > 0 && grupos.length === 0 && !loadingData ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
              <Search size={44} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">
                Nenhum resultado para &quot;{searchTerm}&quot;
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Tente outro número de pedido ou romaneio
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
