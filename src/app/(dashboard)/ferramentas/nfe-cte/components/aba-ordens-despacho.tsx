import { useState } from "react"
import { ChevronDown, ChevronRight, Package, Truck } from "lucide-react"
import type { OrdemDespacho, ResumoDespacho } from "./types"
import { formatarMoeda, formatarNumero } from "./utils"

interface AbaProps {
  ordens: OrdemDespacho[]
  resumo: ResumoDespacho
}

function card(rotulo: string, valor: string, detalhe?: string) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <p className="text-xs font-medium uppercase text-slate-400">{rotulo}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
        {valor}
      </p>
      {detalhe ? <p className="mt-0.5 text-xs text-slate-500">{detalhe}</p> : null}
    </div>
  )
}

function peso(valor: number | null): string {
  if (valor == null || !Number.isFinite(valor)) return "-"
  return `${formatarNumero(Math.round(valor * 1000) / 1000)} kg`
}

/**
 * Aba "Ordens de despacho": o documento que vai para a transportadora, com as
 * notas de um pedido dentro de um romaneio.
 *
 * Os dados vêm dos campos `nf_od_*` que o relatório de CT-e já traz por NF-e —
 * nenhuma requisição extra. Consequência: só aparecem ordens cujas notas também
 * têm CT-e na janela carregada.
 */
export function AbaOrdensDespacho({ ordens, resumo }: AbaProps) {
  const [expandido, setExpandido] = useState<Set<string>>(new Set())

  if (ordens.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
        <Package size={44} className="mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Nenhuma ordem de despacho no recorte
        </p>
        <p className="mt-2 text-xs text-slate-400">
          {resumo.semDespacho > 0
            ? `${resumo.semDespacho} NF-e do recorte não têm ordem de despacho (pedido 0 na base).`
            : "Ajuste o período, a transportadora ou a região."}
        </p>
      </div>
    )
  }

  function toggle(chave: string) {
    setExpandido((prev) => {
      const next = new Set(prev)
      if (next.has(chave)) next.delete(chave)
      else next.add(chave)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {card("Ordens de despacho", formatarNumero(resumo.ordens), `${resumo.pedidos} pedido(s)`)}
        {card("Notas despachadas", formatarNumero(resumo.notas), `${resumo.romaneios} romaneio(s)`)}
        {card(
          "Peças despachadas",
          formatarNumero(resumo.pecas),
          resumo.rolos != null ? `${formatarNumero(resumo.rolos)} rolo(s)` : undefined
        )}
        {card(
          "Valor despachado",
          formatarMoeda(resumo.valor),
          resumo.semDespacho > 0 ? `${resumo.semDespacho} NF-e sem despacho` : undefined
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Uma ordem por pedido + romaneio, da mais recente para a mais antiga. As peças são as da
        ordem de despacho ({`nf_od_qtde`}), não as do rateio do CT-e.
      </p>

      <div className="space-y-2">
        {ordens.map((ordem) => {
          const aberto = expandido.has(ordem.chave)
          return (
            <div
              key={ordem.chave}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggle(ordem.chave)}
                aria-expanded={aberto}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span className="mt-0.5 text-slate-400">
                  {aberto ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Pedido {ordem.pedido ?? "—"}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Romaneio {ordem.romaneio ?? "—"}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {ordem.data ?? "sem data"}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {ordem.notas.length} NF-e
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Truck size={12} />
                      {ordem.transportadora || "sem transportadora"}
                    </span>
                    {ordem.cliente ? ` · ${ordem.cliente}` : ""}
                    {ordem.cidade ? ` · ${ordem.cidade}` : ""}
                    {ordem.regiao ? ` (${ordem.regiao})` : ""}
                    {ordem.representante ? ` · ${ordem.representante}` : ""}
                  </span>
                  <span className="mt-1.5 block text-xs text-slate-600 dark:text-slate-300">
                    {formatarNumero(ordem.pecas)} peças
                    {ordem.rolos != null ? ` · ${formatarNumero(ordem.rolos)} rolo(s)` : ""}
                    {ordem.pesoBruto != null ? ` · ${peso(ordem.pesoBruto)} bruto` : ""}
                    {ordem.pesoLiquido != null ? ` · ${peso(ordem.pesoLiquido)} líquido` : ""}
                    {` · ${formatarMoeda(ordem.valor)}`}
                  </span>
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
                          CT-e
                        </th>
                        <th className="px-4 py-2 text-right text-[10px] font-medium uppercase text-slate-400">
                          Peças
                        </th>
                        <th className="px-4 py-2 text-right text-[10px] font-medium uppercase text-slate-400">
                          Valor
                        </th>
                        <th className="px-4 py-2 text-right text-[10px] font-medium uppercase text-slate-400">
                          Rateio no CT-e
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordem.notas.map((nota) => (
                        <tr
                          key={nota.chave}
                          className="border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                        >
                          <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-200">
                            {nota.nfNumero ?? "—"}
                            {nota.nfSerie ? `/${nota.nfSerie}` : ""}
                          </td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                            {nota.nfData ?? "—"}
                          </td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                            {nota.cteNumero ?? "—"}
                            {nota.cteSerie ? `/${nota.cteSerie}` : ""}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-slate-700 dark:text-slate-200">
                            {formatarNumero(nota.pecas)}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-slate-700 dark:text-slate-200">
                            {formatarMoeda(nota.valor)}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-slate-500 dark:text-slate-400">
                            {formatarMoeda(nota.rateio)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-slate-400">
        Base: campos de despacho do relatório de CT-e (<code>nf_od_*</code>), ou seja apenas notas
        que também têm CT-e na janela carregada.
      </p>
    </div>
  )
}