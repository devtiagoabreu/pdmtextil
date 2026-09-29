"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Download, FileText, Globe, Loader2, Truck } from "lucide-react"
import { toast } from "sonner"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import type { Integracao, LinhaCte, Periodo } from "./components/types"
import {
  agruparPorCte,
  calcularResumo,
  filtrarPorPeriodo,
  formatarMoeda,
  formatarNumero,
  nomeClienteNf,
  nomeTranspDistinct,
  normalizarResposta,
  periodoMesCorrente,
  periodoPadrao,
} from "./components/utils"
import { TabelaCte } from "./components/tabela"
import { Toolbar } from "./components/toolbar"

const TELA = "nfe-cte"

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
    ["% CT-e sobre NFs", (l) => l.pct_cte_sobre_total_nfs],
    ["Soma rateio do CT-e", (l) => l.soma_rateio_do_cte],
    ["Transportadora", (l) => l.cte_transportadora_fantasia || l.cte_transportadora_razao],
    ["Tomador", (l) => l.cte_tomador_fantasia || l.cte_tomador_razao],
    ["NF-e", (l) => (l.nf_serie ? `${l.nf_numero}/${l.nf_serie}` : l.nf_numero)],
    ["Data NF-e", (l) => l.nf_data],
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
  const [transporteFiltro, setTransporteFiltro] = useState("")
  const [termo, setTermo] = useState("")
  const [itens, setItens] = useState<LinhaCte[]>([])
  const [carregado, setCarregado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandido, setExpandido] = useState<Set<string>>(new Set())
  const [itensAbertos, setItensAbertos] = useState<Set<string>>(new Set())

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
    try {
      const res = await fetch(`/api/integracao/${selectedId}/executar`)
      const data = await res.json()
      if (!data.success) {
        toast.error(`API retornou erro: ${data.status ?? res.status}`)
        return
      }
      const linhas = normalizarResposta(data.responseBody)
      if (linhas.length === 0) {
        toast.error("Nenhuma NF-e encontrada no período")
        setCarregado(true)
        return
      }
      setItens(linhas)
      setCarregado(true)
      toast.success(`${linhas.length} NF-e carregada(s)`)
    } catch {
      toast.error("Erro ao consultar o relatório")
    } finally {
      setLoading(false)
    }
  }, [selectedId])

  const limpar = useCallback(() => {
    setItens([])
    setCarregado(false)
    setTransporteFiltro("")
    setTermo("")
    setPeriodo(periodoPadrao())
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
  }, [itens, periodo, transporteFiltro, termo])

  const grupos = useMemo(() => agruparPorCte(filtrados), [filtrados])
  const transportes = useMemo(() => nomeTranspDistinct(agruparPorCte(itens)), [itens])
  const resumo = useMemo(() => calcularResumo(filtrados), [filtrados])

  function toggle(chave: string) {
    setExpandido((prev) => {
      const next = new Set(prev)
      if (next.has(chave)) next.delete(chave)
      else next.add(chave)
      return next
    })
  }

  function toggleItem(chave: string) {
    setItensAbertos((prev) => {
      const next = new Set(prev)
      if (next.has(chave)) next.delete(chave)
      else next.add(chave)
      return next
    })
  }

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
            onPeriodoChange={setPeriodo}
            onAplicar={consultar}
            onLimpar={limpar}
            loading={loading}
            transporteFiltro={transporteFiltro}
            onTransporteFiltroChange={setTransporteFiltro}
            transportes={transportes}
            termo={termo}
            onTermoChange={setTermo}
          >
            <div className="flex items-end gap-2 pb-1">
              <button
                type="button"
                onClick={() => setPeriodo(periodoPadrao())}
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                Últimos 2 meses
              </button>
              <span className="text-xs text-slate-300">·</span>
              <button
                type="button"
                onClick={() => setPeriodo(periodoMesCorrente())}
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                Mês corrente
              </button>
            </div>
          </Toolbar>

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : grupos.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">NF-e</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    {formatarNumero(resumo.nfs)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">CT-es</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    {formatarNumero(resumo.ctes)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total dos CT-es
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    {formatarMoeda(resumo.totalFrete)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rateio dos itens
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    {formatarMoeda(resumo.totalRateio)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    NF-e com valor de nota
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    {formatarNumero(resumo.comValorNf)}
                    <span className="text-sm font-normal text-slate-400">
                      {" "}
                      / {resumo.linhas}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {grupos.length} CT-es · {resumo.linhas} NF-e
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
            </div>
          ) : carregado ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
              <Truck size={44} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Nenhuma NF-e no período selecionado
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Ajuste as datas ou clique em &quot;Limpar&quot; para voltar ao padrão
              </p>
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
