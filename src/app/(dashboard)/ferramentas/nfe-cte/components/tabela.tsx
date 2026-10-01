import { ChevronDown, ChevronRight, Package } from "lucide-react"
import { BadgeFaixaFrete } from "./dashboard"
import type { GrupoCte, LinhaCte } from "./types"
import {
  descricoesItem,
  faixaFreteDoCte,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  nfSemCabecalho,
  nfTemDespacho,
  nfTemRateio,
  nomeClienteNf,
} from "./utils"

interface TabelaProps {
  grupos: GrupoCte[]
  expandido: Set<string>
  onToggle: (chave: string) => void
  itensAbertos: Set<string>
  onToggleItem: (chave: string) => void
}

function rotuloNf(linha: LinhaCte): string {
  if (linha.nf_numero === null) return "NF sem número"
  return `NF ${linha.nf_numero}${linha.nf_serie ? `/${linha.nf_serie}` : ""}`
}

function chaveItem(grupo: GrupoCte, linha: LinhaCte, idx: number): string {
  return `${grupo.chave}|${linha.nf_numero ?? idx}-${linha.nf_serie ?? ""}`
}

function TabelaItens({ linha }: { linha: LinhaCte }) {
  const descricoes = descricoesItem(linha)
  const semDescricao = descricoes.length === 0
  return (
    <table className="w-full text-xs bg-slate-50 dark:bg-slate-800/40">
      <thead>
        <tr className="text-left text-[10px] uppercase text-slate-400">
          <th className="px-4 py-1.5 font-medium">Item do CT-e</th>
          <th className="px-4 py-1.5 text-right font-medium">Qtd</th>
          <th className="px-4 py-1.5 text-right font-medium">Rateio</th>
          <th className="px-4 py-1.5 text-right font-medium">ICMS</th>
        </tr>
      </thead>
      <tbody>
        {semDescricao ? (
          <tr>
            <td
              colSpan={4}
              className="px-4 py-2 text-slate-500 dark:text-slate-400"
            >
              {linha.nf_item_qtd
                ? `${formatarNumero(linha.nf_item_qtd)} item(ns) sem descrição`
                : "Sem itens rateados para esta nota."}
            </td>
          </tr>
        ) : (
          descricoes.map((descricao, i) => (
            <tr key={`${descricao}-${i}`}>
              <td className="px-4 py-1.5 text-slate-700 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Package size={12} className="text-slate-400" />
                  {descricao}
                </span>
              </td>
              <td className="px-4 py-1.5 text-right font-mono text-slate-600 dark:text-slate-400">
                {descricoes.length > 1 && linha.nf_item_qtd_total != null
                  ? `${formatarNumero(linha.nf_item_qtd_total)} ${linha.nf_item_unidade ?? ""}`.trim()
                  : `${formatarNumero(linha.nf_item_qtd)} ${linha.nf_item_unidade ?? ""}`.trim()}
              </td>
              <td className="px-4 py-1.5 text-right font-mono text-slate-700 dark:text-slate-300">
                {descricoes.length > 1 && linha.nf_item_valor_total != null
                  ? "—"
                  : formatarMoeda(linha.nf_item_valor_total)}
              </td>
              <td className="px-4 py-1.5 text-right font-mono text-slate-600 dark:text-slate-400">
                {descricoes.length > 1 && linha.nf_item_icms != null
                  ? "—"
                  : formatarMoeda(linha.nf_item_icms)}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}

export function TabelaCte({
  grupos,
  expandido,
  onToggle,
  itensAbertos,
  onToggleItem,
}: TabelaProps) {
  return (
    <div className="space-y-2">
      {grupos.map((grupo) => {
        const aberto = expandido.has(grupo.chave)
        const comNome = grupo.nfs.find((n) => nomeClienteNf(n))
        const todasSemCabecalho = grupo.nfs.length > 0 && grupo.nfs.every(nfSemCabecalho)
        return (
          <div
            key={grupo.chave}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => onToggle(grupo.chave)}
              aria-expanded={aberto}
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span className="mt-0.5 text-slate-400">
                {aberto ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    CT-e {grupo.numero ?? "—"}
                    {grupo.serie ? `/${grupo.serie}` : ""}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {grupo.data ?? "—"}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {grupo.nfs.length} NF-e
                  </span>
                  {grupo.rateioDivergente && (
                    <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                      rateio não fecha
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                  {grupo.transportadora} · tomador {grupo.tomador}
                  {grupo.situacao !== null ? ` · situação ${grupo.situacao}` : ""}
                  {grupo.dataTransacao ? ` · transação ${grupo.dataTransacao}` : ""}
                </span>
                <span className="mt-1.5 block text-xs text-slate-600 dark:text-slate-300">
                  Frete {formatarMoeda(grupo.valorTotal)}
                  {grupo.somaRateio != null
                    ? ` · rateio dos itens ${formatarMoeda(grupo.somaRateio)}`
                    : grupo.somaRateioCalculada > 0
                      ? ` · rateio dos itens ${formatarMoeda(grupo.somaRateioCalculada)} (calculado)`
                      : ""}
                  {grupo.somaNf != null
                    ? ` · soma das NFs ${formatarMoeda(grupo.somaNf)}`
                    : grupo.somaNfCalculada > 0
                      ? ` · soma das NFs ${formatarMoeda(grupo.somaNfCalculada)} (calculada)`
                      : ""}
                  {grupo.pctSobreNf != null || grupo.pctCalculado !== null ? (
                    <span className="ml-1.5 inline-block align-middle">
                      <BadgeFaixaFrete
                        faixa={faixaFreteDoCte(grupo)}
                        pct={grupo.pctSobreNf ?? grupo.pctCalculado}
                      />
                    </span>
                  ) : null}
                </span>
                {grupo.rateioDivergente && (
                  <span className="mt-1 block text-xs text-rose-600 dark:text-rose-400">
                    O rateio dos itens não fecha com o total do CT-e — conferido no cadastro
                    do ERP.
                  </span>
                )}
              </span>
            </button>

            {aberto && (
              <div className="border-t border-slate-100 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
                      <th className="px-4 py-2 text-[10px] font-medium uppercase text-slate-400">
                        Nota
                      </th>
                      <th className="px-4 py-2 text-[10px] font-medium uppercase text-slate-400">
                        Emissão
                      </th>
                      <th className="px-4 py-2 text-[10px] font-medium uppercase text-slate-400">
                        Despacho
                      </th>
                      <th className="px-4 py-2 text-[10px] font-medium uppercase text-slate-400">
                        Cliente
                      </th>
                      <th className="px-4 py-2 text-right text-[10px] font-medium uppercase text-slate-400">
                        Valor da nota
                      </th>
                      <th className="px-4 py-2 text-right text-[10px] font-medium uppercase text-slate-400">
                        Rateio
                      </th>
                      <th className="px-4 py-2 text-right text-[10px] font-medium uppercase text-slate-400">
                        % no CT-e
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.nfs.map((linha, idx) => {
                      const chave = chaveItem(grupo, linha, idx)
                      const itemAberto = itensAbertos.has(chave)
                      const temRateio = nfTemRateio(linha)
                      return (
                        <tr
                          key={chave}
                          className="border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                        >
                          <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-200">
                            {temRateio ? (
                              <button
                                type="button"
                                onClick={() => onToggleItem(chave)}
                                aria-expanded={itemAberto}
                                className="inline-flex items-center gap-1.5 hover:underline"
                              >
                                <span className="text-slate-400">
                                  {itemAberto ? (
                                    <ChevronDown size={14} />
                                  ) : (
                                    <ChevronRight size={14} />
                                  )}
                                </span>
                                {rotuloNf(linha)}
                              </button>
                            ) : (
                              rotuloNf(linha)
                            )}
                            {nfSemCabecalho(linha) && (
                              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                prevista
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                            {nfTemDespacho(linha) ? (
                              <>
                                <span className="block font-mono">
                                  pedido {formatarNumero(linha.nf_od_pedido)}
                                </span>
                                {linha.nf_od_romaneio != null && (
                                  <span className="block text-[10px] text-slate-400">
                                    romaneio {formatarNumero(linha.nf_od_romaneio)}
                                  </span>
                                )}
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                            {linha.nf_data ?? "—"}
                          </td>
                          <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                            {nomeClienteNf(linha) ?? "—"}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-slate-900 dark:text-slate-100">
                            {formatarMoeda(linha.nf_valor_total)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-slate-600 dark:text-slate-300">
                            {formatarMoeda(linha.nf_item_valor_total)}
                            {linha.nf_pct_rateio_no_cte != null && (
                              <span className="block text-[10px] text-slate-400">
                                {formatarPercentual(linha.nf_pct_rateio_no_cte)} do CT-e
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-slate-600 dark:text-slate-300">
                            {formatarPercentual(linha.pct_nf_no_total_cte)}
                          </td>
                        </tr>
                      )
                    })}
                    <tr>
                      <td className="px-4 py-2 text-xs uppercase text-slate-400" colSpan={4}>
                        Total do CT-e
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {formatarNumero(grupo.nfs.length)} NF-e
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-slate-700 dark:text-slate-300">
                        {grupo.somaRateio != null
                          ? formatarMoeda(grupo.somaRateio)
                          : formatarMoeda(grupo.somaRateioCalculada || null)}
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-slate-500 dark:text-slate-400">
                        {grupo.somaNf != null
                          ? formatarMoeda(grupo.somaNf)
                          : formatarMoeda(grupo.somaNfCalculada || null)}
                      </td>
                    </tr>
                  </tbody>
                </table>
                {grupo.nfs.map((linha, idx) => {
                  const chave = chaveItem(grupo, linha, idx)
                  if (!itensAbertos.has(chave)) return null
                  return (
                    <div
                      key={`${chave}-itens`}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <TabelaItens linha={linha} />
                    </div>
                  )
                })}
                {todasSemCabecalho ? (
                  <p className="px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
                    NF-e não localizada no fiscal: o CT-e aponta para nota prevista, sem valor
                    e sem data no cadastro. O rateio acima vem dos itens do próprio CT-e, não da
                    nota.
                  </p>
                ) : (
                  !comNome && (
                    <p className="px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
                      Nenhuma NF deste CT-e tem cliente ou fornecedor vinculado.
                    </p>
                  )
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
