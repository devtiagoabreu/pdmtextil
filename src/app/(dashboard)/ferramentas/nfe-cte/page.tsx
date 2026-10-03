"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Download, FileText, Globe, Loader2, Truck } from "lucide-react"
import { toast } from "sonner"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import type { FaixaFrete, Integracao, LinhaCte, Periodo } from "./components/types"
import type { ChavePeriodo } from "./components/utils"
import {
  ApiRelatorioError,
  LIMITE_PAGINA,
  alcanceCarregado,
  agruparPorCte,
  buscarTodasPaginas,
  calcularResumo,
  classificarFaixaFrete,
  filtrarPorPeriodo,
  filtrarPorRegiao,
  formatarDataBr,
  formatarMoeda,
  formatarNumero,
  nomeClienteNf,
  nomeRegiaoDistinct,
  nomeTranspDistinct,
  agruparOrdensDespacho,
  periodoDePreset,
  periodoPadrao,
  presetQueCombinaCom,
  resumoOrdensDespacho,
} from "./components/utils"
import { TabelaCte } from "./components/tabela"
import { Toolbar } from "./components/toolbar"
import { Dashboard } from "./components/dashboard"
import { AbaOrdensDespacho } from "./components/aba-ordens-despacho"

const TELA = "nfe-cte"

const ABAS = [
  { chave: "cte" as const, rotulo: "CT-e" },
  { chave: "despacho" as const, rotulo: "Ordens de despacho" },
]

/** Rótulos textuais da faixa de frete, para o CSV. */
const ROTULO_FAIXA_CSV: Record<FaixaFrete, string> = {
  abaixo: "até 1,5%",
  na_faixa: "na faixa (1,5% a 2,0%)",
  acima: "acima de 2,0%",
  indefinido: "sem dado",
}

function csvCell(valor: unknown): string {
  if (valor === null || valor === undefined) return '""'
  const s = String(valor)
  const precisaAspas = /[";\n]/.test(s) || /^\s|\s$/.test(s)
  return precisaAspas ? `"${s.replace(/"/g, '""')}"` : s
}

function baixarCsv(itens: LinhaCte[], nome: string) {
  const colunas: [string, (l: LinhaCte) => unknown][] = [
    ["CT-e", (l) => (l.cte_serie ? `${l.cte_numero}/${l.cte_serie}` : l.cte_numero)],
    ["Data CT-e", (l) => l.cte_data],
    ["Data transacao", (l) => l.cte_data_transacao],
    ["Natureza", (l) => l.cte_natureza],
    ["Tipo conhecimento", (l) => l.cte_tipo_conhecimento],
    ["Cidade origem", (l) => l.cte_cod_cidade_origem],
    ["Cidade destino", (l) => l.cte_cod_cidade_destino],
    ["Valor CT-e", (l) => l.cte_valor_total],
    ["Soma NFs do CT-e", (l) => l.soma_nf_do_cte],
    ["Frete % sobre mercadoria", (l) => l.pct_cte_sobre_total_nfs],
    ["Faixa de frete", (l) => ROTULO_FAIXA_CSV[classificarFaixaFrete(l.pct_cte_sobre_total_nfs)]],
    ["Soma rateio do CT-e", (l) => l.soma_rateio_do_cte],
    ["Transportadora", (l) => l.cte_transportadora_fantasia || l.cte_transportadora_razao],
    ["Tomador", (l) => l.cte_tomador_fantasia || l.cte_tomador_razao],
    ["NF-e", (l) => (l.nf_serie ? `${l.nf_numero}/${l.nf_serie}` : l.nf_numero)],
    ["Data NF-e", (l) => l.nf_data],
    ["Pedido de despacho", (l) => l.nf_od_pedido],
    ["Romaneio", (l) => l.nf_od_romaneio],
    ["Data de despacho", (l) => l.nf_od_data],
    ["Cliente (despacho)", (l) => l.nf_od_cliente_fantasia || l.nf_od_cliente_razao],
    ["Cidade (despacho)", (l) => l.nf_od_cidade],
    ["Representante", (l) => l.nf_od_representante],
    ["Valor NF-e", (l) => l.nf_valor_total],
    ["% NF-e no CT-e", (l) => l.pct_nf_no_total_cte],
    ["Origem do valor", (l) => l.nf_valor_origem],
    ["Itens rateados", (l) => l.nf_item_qtd],
    ["Quantidade total", (l) => l.nf_item_qtd_total],
    ["Unidade", (l) => l.nf_item_unidade],
    ["Itens (descricoes)", (l) => l.nf_item_descricoes],
    ["Valor do rateio", (l) => l.nf_item_valor_total],
    ["ICMS do rateio", (l) => l.nf_item_icms],
    ["% rateio no CT-e", (l) => l.nf_pct_rateio_no_cte],
    ["Frete rateado", (l) => l.nf_frete_rateado],
    ["Cliente", (l) => nomeClienteNf(l)],
    ["Cliente (razao social)", (l) => l.nf_cliente_razao],
    ["Fornecedor (emissor)", (l) => l.nf_fornecedor_fantasia || l.nf_fornecedor_razao],
    ["Situacao NF-e", (l) => l.nf_situacao],
    ["Origem do cabecalho", (l) => l.nf_cab_origem],
  ]
  const cabecalho = colunas.map(([t]) => csvCell(t)).join(",")
  const linhas = itens.map((l) => colunas.map(([, get]) => csvCell(get(l))).join(","))
  const conteudo = "\uFEFF" + [cabecalho, ...linhas].join("\r\n")
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function NfeCtePage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)

  const [integracoes, setIntegracoes] = useState<Integracao[]>([])
  const [loadingInt, setLoadingInt] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoPadrao())
  const [presetPeriodo, setPresetPeriodo] = useState<ChavePeriodo>("12m")
  const [transporteFiltro, setTransporteFiltro] = useState("")
  const [regiaoFiltro, setRegiaoFiltro] = useState("")
  const [termo, setTermo] = useState("")
  const [itens, setItens] = useState<LinhaCte[]>([])
  const [carregado, setCarregado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandido, setExpandido] = useState<Set<string>>(new Set())
  const [itensAbertos, setItensAbertos] = useState<Set<string>>(new Set())
  // Teto de paginação do endpoint: se bater, os totais são de um recorte parcial.
  const [truncadoEm, setTruncadoEm] = useState<number | null>(null)
  const [abaAtiva, setAbaAtiva] = useState<"cte" | "despacho">("cte")

  useEffect(() => {
    let ativo = true
    setLoadingInt(true)
    fetch(`/api/integracao/listar?tela=${encodeURIComponent(TELA)}`)
      .then((res: Response) => res.json())
      .then((data: Integracao[]) => {
        if (!ativo) return
        setIntegracoes(Array.isArray(data) ? data : [])
        if (Array.isArray(data) && data.length > 0) setSelectedId(data[0].id)
      })
      .catch(() => {
        if (ativo) toast.error("Erro ao carregar integrações")
      })
      .finally(() => {
        if (ativo) setLoadingInt(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  const consultar = useCallback(async () => {
    if (!selectedId) return
    setLoading(true)
    setItens([])
    setCarregado(false)
    setTruncadoEm(null)
    try {
      const linhas = await buscarTodasPaginas(async (offset) => {
        const res = await fetch(
          `/api/integracao/${selectedId}/executar?limit=${LIMITE_PAGINA}&offset=${offset}`
        )
        const data = await res.json()
        if (!data.success) {
          throw new ApiRelatorioError(data.status ?? res.status)
        }
        return data.responseBody
      }, setTruncadoEm)
      if (linhas.length === 0) {
        toast.error("Nenhuma NF-e encontrada no período")
        setCarregado(true)
        return
      }
      setItens(linhas)
      setCarregado(true)
      toast.success(`${linhas.length} NF-e carregada(s)`)
    } catch (erro) {
      if (erro instanceof ApiRelatorioError) {
        toast.error(erro.message)
      } else {
        toast.error("Erro ao consultar o relatório")
      }
    } finally {
      setLoading(false)
    }
  }, [selectedId])

  /**
   * Digitar as datas na mão tira o atalho: o select passa a mostrar
   * "Personalizado" em vez de mentir com "Últimos 12 meses".
   */
  const mudarPeriodo = useCallback((novo: Periodo) => {
    setPeriodo(novo)
    setPresetPeriodo(presetQueCombinaCom(novo) ?? "personalizado")
  }, [])

  const aplicarPresetPeriodo = useCallback((chave: ChavePeriodo) => {
    const alvo = periodoDePreset(chave)
    setPresetPeriodo(chave)
    if (alvo) setPeriodo(alvo)
  }, [])

  const limpar = useCallback(() => {
    setItens([])
    setCarregado(false)
    setTransporteFiltro("")
    setRegiaoFiltro("")
    setTermo("")
    setPeriodo(periodoPadrao())
    setPresetPeriodo("12m")
    setTruncadoEm(null)
    setExpandido(new Set())
    setItensAbertos(new Set())
  }, [])

  const filtrados = useMemo(() => {
    let resultado = filtrarPorPeriodo(itens, periodo)
    if (transporteFiltro) {
      const alvo = transporteFiltro.toLowerCase()
      resultado = resultado.filter((l) => {
        const nome = (l.cte_transportadora_fantasia || l.cte_transportadora_razao || "").toLowerCase()
        return nome === alvo
      })
    }
    resultado = filtrarPorRegiao(resultado, regiaoFiltro)
    const busca = termo.trim().toLowerCase()
    if (busca) {
      resultado = resultado.filter(
        (l) =>
          String(l.nf_numero ?? "").includes(busca) ||
          String(l.cte_numero ?? "").includes(busca) ||
          String(l.nf_serie ?? "").toLowerCase() === busca ||
          String(l.cte_serie ?? "").toLowerCase() === busca
      )
    }
    return resultado
  }, [itens, periodo, transporteFiltro, regiaoFiltro, termo])

  const grupos = useMemo(() => agruparPorCte(filtrados), [filtrados])
  // As opções dos filtros saem de TODOS os itens carregados, e não dos já
  // filtrados, para o select não sumir a opção que está selecionada.
  const gruposCarregados = useMemo(() => agruparPorCte(itens), [itens])
  const transportes = useMemo(() => nomeTranspDistinct(gruposCarregados), [gruposCarregados])
  const regioes = useMemo(() => nomeRegiaoDistinct(gruposCarregados), [gruposCarregados])
  const resumo = useMemo(() => calcularResumo(filtrados), [filtrados])
  // Aba de ordens de despacho: mesmo recorte, outra leitura (pedido + romaneio).
  const ordensDespacho = useMemo(() => agruparOrdensDespacho(filtrados), [filtrados])
  const resumoDespacho = useMemo(
    () => resumoOrdensDespacho(ordensDespacho, resumo.linhas - resumo.comDespacho),
    [ordensDespacho, resumo]
  )
  // Só para a mensagem de "nada encontrado": distingue "o período não bate" de
  // "os filtros não batem", que antes mostravam a mesma frase.
  const filtrosAtivos =
    transporteFiltro !== "" || regiaoFiltro !== "" || termo.trim() !== ""
  const alcance = useMemo(() => alcanceCarregado(itens), [itens])

  // `useCallback` não é preciosismo: sem isso os dois `toggle` nascem novos a
  // cada render da página e o `memo` do `TabelaCte` nunca segura — expandir um
  // CT-e redesenharia a grade inteira.
  const toggle = useCallback((chave: string) => {
    setExpandido((prev) => {
      const next = new Set(prev)
      if (next.has(chave)) next.delete(chave)
      else next.add(chave)
      return next
    })
  }, [])

  const toggleItem = useCallback((chave: string) => {
    setItensAbertos((prev) => {
      const next = new Set(prev)
      if (next.has(chave)) next.delete(chave)
      else next.add(chave)
      return next
    })
  }, [])

  function exportar() {
    if (filtrados.length === 0) return
    baixarCsv(filtrados, `nfe-cte_${periodo.de || "inicio"}_a_${periodo.ate || "fim"}.csv`)
    toast.success("CSV exportado")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/ferramentas"
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <div className="flex items-center gap-2">
          <FileText className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            NF-e → CT-e por Período{info && <InfoButton content={info} />}
          </h1>
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4">
        Lista as NF-e que possuem CT-e, com transportadora, tomador, fornecedor e o peso de cada
        nota dentro do CT-e. Origem: relatório{" "}
        <code className="text-xs">api_rel_nfe_cte_periodo</code> no Systêxtil.
      </p>

      {loadingInt ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      ) : integracoes.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <Globe size={44} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Nenhuma integração configurada para {TELA}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre uma integração em Configurações &gt; Integrações com a tela &quot;{TELA}&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Toolbar
            integracoes={integracoes}
            selectedId={selectedId}
            onSelectIntegracao={setSelectedId}
            periodo={periodo}
            onPeriodoChange={mudarPeriodo}
            presetPeriodo={presetPeriodo}
            onPresetPeriodoChange={aplicarPresetPeriodo}
            onAplicar={consultar}
            onLimpar={limpar}
            loading={loading}
            transporteFiltro={transporteFiltro}
            onTransporteFiltroChange={setTransporteFiltro}
            transportes={transportes}
            regiaoFiltro={regiaoFiltro}
            onRegiaoFiltroChange={setRegiaoFiltro}
            regioes={regioes}
            termo={termo}
            onTermoChange={setTermo}
            alcance={alcance}
          />

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : grupos.length > 0 ? (
            <div className="space-y-4">
              <div role="tablist" aria-label="Relatórios" className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
                {ABAS.map((aba) => (
                  <button
                    key={aba.chave}
                    role="tab"
                    type="button"
                    aria-selected={abaAtiva === aba.chave}
                    onClick={() => setAbaAtiva(aba.chave)}
                    className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                      abaAtiva === aba.chave
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    {aba.rotulo}
                  </button>
                ))}
              </div>

              {abaAtiva === "despacho" ? (
                <AbaOrdensDespacho ordens={ordensDespacho} resumo={resumoDespacho} />
              ) : (
                <>
                  <Dashboard grupos={grupos} resumo={resumo} />

              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {grupos.length} CT-es · {resumo.linhas} NF-e
                  {` · ${resumo.comDespacho} NF-e em ordem de despacho`}
                  {resumo.semData > 0
                    ? ` · ${resumo.semData} sem data de referência (mantidas)`
                    : ""}
                  {resumo.semCabecalho > 0
                    ? ` · ${resumo.semCabecalho} NF-e não localizadas no fiscal (valor vem do rateio do CT-e)`
                    : ""}
                  {resumo.ctesRateioDivergente > 0
                    ? ` · ${resumo.ctesRateioDivergente} CT-es com rateio divergente do total`
                    : ""}
                </p>
                {truncadoEm !== null && (
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    Resultado truncado em {truncadoEm.toLocaleString("pt-BR")} linhas — reduza o
                    período para ver os totais completos
                  </p>
                )}
                <button
                  type="button"
                  onClick={exportar}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Download size={14} />
                  Exportar CSV
                </button>
              </div>

              <TabelaCte
                grupos={grupos}
                expandido={expandido}
                onToggle={toggle}
                itensAbertos={itensAbertos}
                onToggleItem={toggleItem}
              />
                </>
              )}
            </div>
          ) : carregado ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
              <Truck size={44} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {filtrosAtivos
                  ? "Nenhuma NF-e para os filtros selecionados"
                  : "Nenhuma NF-e no período selecionado"}
              </p>
              {filtrosAtivos ? (
                <p className="text-xs text-slate-400 mt-1">
                  Ajuste a transportadora, a região ou a busca
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-1">
                  Ajuste as datas ou clique em &quot;Limpar&quot; para voltar ao padrão
                </p>
              )}
              {alcance.de && (
                <p className="text-xs text-slate-400 mt-2">
                  O relatório carregado cobre {formatarDataBr(alcance.de)} a{" "}
                  {formatarDataBr(alcance.ate)} — o filtro de período reduz essa janela, mas
                  não amplia
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
              <Truck size={44} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Consulte o relatório para ver as NF-e
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Escolha o período e clique em &quot;Consultar&quot;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
