"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { toast } from "sonner"
import { ArrowLeft, Globe, Loader2, Truck } from "lucide-react"
import Link from "next/link"
import type { GrupoRomaneio, Integracao, ItemCorteDialog, OrientacaoPdf, Rolo } from "./components/types"
import { agruparProdutos } from "./components/utils"
import { gerarPdfRomaneio, gerarPdfRomaneioConsolidado } from "./components/romaneio-pdf"
import { RomaneioCard } from "./components/romaneio-card"
import { Toolbar } from "./components/toolbar"
import { RequisicaoDialog } from "./components/requisicao-dialog"

export default function RequisicaoPorRomaneioPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)

  const [integracoes, setIntegracoes] = useState<Integracao[]>([])
  const [loadingInt, setLoadingInt] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [itens, setItens] = useState<Rolo[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [expandedRomaneio, setExpandedRomaneio] = useState<number | null>(null)
  const [selectedRomaneios, setSelectedRomaneios] = useState<Set<number>>(new Set())
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [orientacaoPdf, setOrientacaoPdf] = useState<OrientacaoPdf>("portrait")
  const [criando, setCriando] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogRomaneio, setDialogRomaneio] = useState<GrupoRomaneio | null>(null)
  const [dialogItens, setDialogItens] = useState<ItemCorteDialog[]>([])

  useEffect(() => {
    setLoadingInt(true)
    const tela = pathname.replace(/^\//, "").split("/").pop() || ""
    fetch(`/api/integracao/listar?tela=${encodeURIComponent(tela)}`)
      .then((res: any) => res.json())
      .then((data: any) => {
        setIntegracoes(data)
        if (data.length > 0) setSelectedId(data[0].id)
      })
      .catch(() => toast.error("Erro ao carregar integrações"))
      .finally(() => setLoadingInt(false))
  }, [pathname])

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
          produtos: [],
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
    const result = Array.from(map.values()).sort((a: any, b: any) => b.romaneio - a.romaneio)
    for (const g of result) {
      g.produtos = agruparProdutos(g.rolos)
    }
    return result
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

  function handleCarregarTodos() {
    setSearchInput("")
    setSearchTerm("")
    setSelectedRomaneios(new Set())
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

  function abrirDialog(grupo: GrupoRomaneio) {
    setDialogRomaneio(grupo)
    setDialogItens(
      grupo.produtos.map((p: any) => ({
        produto: p.nome,
        narrativa: p.narrativa,
        cor: p.cor,
        metragemDisponivel: p.totalMetragem,
        metragem: p.totalMetragem > 0 ? String(p.totalMetragem) : "",
      })),
    )
    setDialogOpen(true)
  }

  function atualizarMetragem(index: number, valor: string) {
    setDialogItens((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], metragem: valor }
      return next
    })
  }

  async function confirmarCriacao() {
    if (!dialogRomaneio) return

    const itensValidos = dialogItens.filter((item: any) => {
      const num = parseFloat(item.metragem.replace(",", "."))
      return !isNaN(num) && num > 0
    })

    if (itensValidos.length === 0) {
      toast.error("Informe a metragem para pelo menos um produto")
      return
    }

    setCriando(true)
    try {
      const itensPayload = itensValidos.map((item: any) => {
        const partes = item.produto.split(".")
        const bbbbb = partes[1] || ""
        const dddddd = partes[3] || ""
        return {
          codigoProduto: item.produto,
          ordem: bbbbb,
          artigo: item.narrativa || "",
          cor: dddddd.slice(-2),
          desenho: dddddd.slice(0, 4),
          quantidade: item.metragem,
        }
      })

      const res = await fetch("/api/comercial/requisicoes-corte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: itensPayload,
          observacoes: `Criado a partir do Romaneio Nº ${dialogRomaneio.romaneio}`,
          entreguePor: "",
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao criar requisição")
      }

      const criada = await res.json()
      toast.success(`Requisição de corte #${criada.id} criada com sucesso!`)
      setDialogOpen(false)
      router.push(`/comercial/requisicoes-corte/${criada.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar requisição")
    } finally {
      setCriando(false)
    }
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
      <div className="flex items-center gap-4">
        <Link
          href="/comercial/requisicoes-corte"
          className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Requisição de Corte por Romaneio{info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Selecione um romaneio e crie uma requisição de corte com a metragem desejada
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
              <div className="space-y-4">
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
                    onAbrirDialog={() => abrirDialog(grupo)}
                  />
                ))}
              </div>
            </div>
          ) : itens.length === 0 && !loadingData ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
              <Truck size={44} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">
                Carregue os romaneios para criar requisições de corte
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Clique em &quot;Carregar Todos&quot; para listar os romaneios disponíveis
              </p>
            </div>
          ) : null}
        </div>
      )}

      <RequisicaoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        romaneio={dialogRomaneio}
        itens={dialogItens}
        onAtualizarMetragem={atualizarMetragem}
        onConfirmar={confirmarCriacao}
        criando={criando}
      />
    </div>
  )
}
