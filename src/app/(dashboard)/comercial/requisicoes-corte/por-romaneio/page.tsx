"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Loader2, Truck, Search, RefreshCw, Globe, Scissors,
  ChevronDown, ChevronUp, User, MapPin, Hash,
  FileText, ArrowLeft, Package, Plus
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import Link from "next/link"

interface Integracao {
  id: number
  nome: string
  baseUrl: string
  tipoAuth: string
  telas?: string[]
}

interface Rolo {
  romaneio: number
  codigo_rolo: number
  produto: string
  narrativa: string
  lote: number
  lote_produto: string
  quantidade: number
  peso_bruto: number
  peso_liquido: number
  largura: number
  endereco_rolo: string | null
  pedido: number
  situacao: string
  emissao: string
  entrega: string
  chegada: string | null
  cnpj: string
  nome_cliente: string
  fantasia: string
  cidade: string
  uf: string
  nome_represenante: string
  nome_regiao: string
  linha: string
  grupo: string
  sub: string
  cor: string
}

interface ProdutoAgrupado {
  nome: string
  narrativa: string
  cor: string
  totalMetragem: number
  rolos: Rolo[]
}

interface GrupoRomaneio {
  romaneio: number
  capa: Rolo
  rolos: Rolo[]
  produtos: ProdutoAgrupado[]
  totalRolos: number
  totalMetragem: number
}

function formatarData(data: string | null | undefined): string {
  if (!data) return "—"
  try {
    return new Date(data).toLocaleDateString("pt-BR")
  } catch {
    return data
  }
}

function formatarMetragem(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—"
  return `${Number(valor).toFixed(1)} m`
}

interface ItemCorteDialog {
  produto: string
  narrativa: string
  cor: string
  metragemDisponivel: number
  metragem: string
}

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
  const [criando, setCriando] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogRomaneio, setDialogRomaneio] = useState<GrupoRomaneio | null>(null)
  const [dialogItens, setDialogItens] = useState<ItemCorteDialog[]>([])

  useEffect(() => {
    setLoadingInt(true)
    fetch("/api/integracao/listar?tela=romaneios")
      .then((res) => res.json())
      .then((data) => {
        setIntegracoes(data)
        if (data.length > 0) setSelectedId(data[0].id)
      })
      .catch(() => toast.error("Erro ao carregar integrações"))
      .finally(() => setLoadingInt(false))
  }, [])

  const itensFiltrados = useMemo(() => {
    if (!searchTerm) return itens
    const termo = searchTerm.toLowerCase()
    return itens.filter(
      (item) =>
        String(item.pedido).includes(termo) ||
        String(item.romaneio).includes(termo),
    )
  }, [itens, searchTerm])

  function agruparProdutos(rolos: Rolo[]): ProdutoAgrupado[] {
    const map = new Map<string, Rolo[]>()
    for (const r of rolos) {
      const key = r.produto || "SEM PRODUTO"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }
    const produtos: ProdutoAgrupado[] = []
    for (const [nome, rolos] of map) {
      const total = rolos.reduce((acc, r) => acc + (r.quantidade || 0), 0)
      produtos.push({
        nome,
        narrativa: rolos[0]?.narrativa || "",
        cor: rolos[0]?.cor || "",
        totalMetragem: total,
        rolos,
      })
    }
    return produtos.sort((a, b) => a.nome.localeCompare(b.nome))
  }

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
        }
        map.set(item.romaneio, grupo)
      }
      grupo.rolos.push(item)
      grupo.totalRolos++
      grupo.totalMetragem += item.quantidade || 0
    }
    const result = Array.from(map.values()).sort((a, b) => b.romaneio - a.romaneio)
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
    buscar()
  }

  function handleSearch() {
    const termo = searchInput.trim()
    setSearchTerm(termo)
    setExpandedRomaneio(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch()
  }

  function handleLimparBusca() {
    setSearchInput("")
    setSearchTerm("")
    setExpandedRomaneio(null)
  }

  function abrirDialog(grupo: GrupoRomaneio) {
    setDialogRomaneio(grupo)
    setDialogItens(
      grupo.produtos.map((p) => ({
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

    const itensValidos = dialogItens.filter((item) => {
      const num = parseFloat(item.metragem.replace(",", "."))
      return !isNaN(num) && num > 0
    })

    if (itensValidos.length === 0) {
      toast.error("Informe a metragem para pelo menos um produto")
      return
    }

    setCriando(true)
    try {
      const itensPayload = itensValidos.map((item) => ({
        codigoProduto: item.produto,
        ordem: String(dialogRomaneio!.capa.pedido || ""),
        artigo: item.narrativa || "",
        cor: item.cor || "",
        desenho: "",
        quantidade: item.metragem,
      }))

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Integração</label>
                <div className="flex gap-2 flex-wrap">
                  {integracoes.map((int) => (
                    <button
                      key={int.id}
                      type="button"
                      onClick={() => setSelectedId(int.id)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        selectedId === int.id
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      {int.nome}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    Nº Pedido / Romaneio
                  </label>
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ex: 7603 ou 22742"
                    className="w-48"
                  />
                </div>
                <Button onClick={handleSearch} disabled={!selectedId || loadingData || itens.length === 0} className="gap-2">
                  <Search size={16} />
                  Buscar
                </Button>
                {searchTerm && (
                  <Button variant="outline" onClick={handleLimparBusca} className="gap-2">
                    Limpar Filtro
                  </Button>
                )}
                <Button variant="outline" onClick={handleCarregarTodos} disabled={!selectedId || loadingData} className="gap-2">
                  {loadingData ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Carregar Todos
                </Button>
              </div>
            </div>
          </div>

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
                {grupos.map((grupo) => (
                  <div
                    key={grupo.romaneio}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                              Romaneio Nº {grupo.romaneio}
                            </h2>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-medium">
                              {grupo.totalRolos} rolo(s)
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                              Pedido {grupo.capa.pedido}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => abrirDialog(grupo)}
                            className="gap-1.5 text-xs"
                          >
                            <Scissors size={14} />
                            Requisição de Corte
                          </Button>
                          <button
                            onClick={() =>
                              setExpandedRomaneio(
                                expandedRomaneio === grupo.romaneio ? null : grupo.romaneio,
                              )
                            }
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {expandedRomaneio === grupo.romaneio ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <User size={14} className="shrink-0" />
                          <span className="truncate">{grupo.capa.nome_cliente}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <MapPin size={14} className="shrink-0" />
                          <span className="truncate">
                            {grupo.capa.cidade}/{grupo.capa.uf}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Hash size={14} className="shrink-0" />
                          <span>CNPJ: {grupo.capa.cnpj}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Package size={14} className="shrink-0" />
                          <span className="truncate">Rep: {grupo.capa.nome_represenante}</span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {grupo.produtos.map((prod) => (
                          <div
                            key={prod.nome}
                            className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3"
                          >
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate" title={prod.nome}>
                              {prod.nome}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {formatarMetragem(prod.totalMetragem)} disponível
                            </p>
                            {prod.cor && (
                              <p className="text-[11px] text-slate-400 truncate" title={prod.cor}>
                                Cor: {prod.cor}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {expandedRomaneio === grupo.romaneio && (
                      <div className="border-t border-slate-200 dark:border-slate-700">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                              <tr>
                                <th className="px-3 py-2.5 text-center text-[11px] font-medium text-slate-500 uppercase w-10">#</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500 uppercase">Cód. Rolo</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500 uppercase">Produto</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500 uppercase">Narrativa</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500 uppercase">Lote</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-medium text-slate-500 uppercase">Metragem</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-medium text-slate-500 uppercase">P. Bruto</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-medium text-slate-500 uppercase">P. Líquido</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {(() => {
                                const prodsMap = new Map<string, Map<string, Rolo[]>>()
                                for (const r of grupo.rolos) {
                                  const p = r.produto || "SEM PRODUTO"
                                  const l = r.lote_produto || "SEM LOTE"
                                  if (!prodsMap.has(p)) prodsMap.set(p, new Map())
                                  const lm = prodsMap.get(p)!
                                  if (!lm.has(l)) lm.set(l, [])
                                  lm.get(l)!.push(r)
                                }
                                const prodsSorted = Array.from(prodsMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
                                const trs: React.ReactNode[] = []
                                for (const [prodNome, lotesMap] of prodsSorted) {
                                  const lotsSorted = Array.from(lotesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
                                  trs.push(
                                    <tr key={`prod-${prodNome}`} className="bg-purple-50 dark:bg-purple-950/20">
                                      <td colSpan={7} className="px-4 py-2 text-sm font-bold text-purple-700 dark:text-purple-400">
                                        PRODUTO: {prodNome}
                                      </td>
                                    </tr>
                                  )
                                  for (const [loteNome, rolos] of lotsSorted) {
                                    trs.push(
                                      <tr key={`lote-${prodNome}-${loteNome}`} className="bg-blue-50 dark:bg-blue-950/30">
                                        <td colSpan={7} className="px-4 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                                          LOTE {loteNome}
                                        </td>
                                      </tr>
                                    )
                                    rolos.forEach((rolo, idx) => {
                                      trs.push(
                                        <tr key={rolo.codigo_rolo} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                          <td className="px-3 py-2 text-sm text-slate-500 text-center font-mono text-[12px]">{idx + 1}</td>
                                          <td className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-200 font-mono">{rolo.codigo_rolo}</td>
                                          <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-mono text-[12px]">{rolo.produto}</td>
                                          <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={rolo.narrativa}>{rolo.narrativa}</td>
                                          <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-mono">{rolo.lote_produto}</td>
                                          <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 text-right font-mono">{formatarMetragem(rolo.quantidade)}</td>
                                          <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 text-right font-mono">{`${Number(rolo.peso_bruto || 0).toFixed(4)} kg`}</td>
                                        </tr>
                                      )
                                    })
                                  }
                                }
                                return trs
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Requisição de Corte</DialogTitle>
            <DialogDescription>
              Romaneio Nº {dialogRomaneio?.romaneio} — Informe a metragem desejada para cada produto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {dialogItens.map((item, index) => (
              <div
                key={item.produto}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                      {item.produto}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Disponível: {formatarMetragem(item.metragemDisponivel)}
                      {item.cor && ` — Cor: ${item.cor}`}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] text-slate-500">Metragem para corte</Label>
                  <Input
                    value={item.metragem}
                    onChange={(e) => atualizarMetragem(index, e.target.value)}
                    placeholder="Ex: 50"
                    className="h-9 text-sm mt-0.5"
                  />
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarCriacao} disabled={criando} className="gap-2">
              {criando && <Loader2 size={16} className="animate-spin" />}
              <Scissors size={16} />
              Criar Requisição de Corte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
