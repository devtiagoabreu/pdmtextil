import { memo, useEffect, useState } from "react"
import { ChevronDown, ChevronRight, Package, Truck } from "lucide-react"
import type { OrdemDespacho, ResumoDespacho } from "./types"
import { formatarMoeda, formatarNumero } from "./utils"

interface AbaProps {
  ordens: OrdemDespacho[]
  resumo: ResumoDespacho
}

/**
 * Cargas montadas por vez. Medido no trace de produção (03/10/2026): trocar
 * para esta aba levava 442 ms de INP, porque o recorte de 12 meses tem 300
 * cargas e cada cartão traz cabeçalho, ícones e linha de totais — ~4.500 nós
 * de uma vez. Os cards de resumo continuam mostrando o total inteiro.
 */
const ORDENS_POR_PAGINA = 40

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

/** "RECIFE, SAO PAULO" ou "RECIFE +2" quando a carga tem muitos destinos. */
function destinos(ordem: OrdemDespacho): string {
  if (ordem.destinos.length === 0) return "destino não informado"
  if (ordem.destinos.length === 1) return ordem.destinos[0]
  if (ordem.destinos.length <= 3) return ordem.destinos.join(", ")
  return `${ordem.destinos.slice(0, 2).join(", ")} +${ordem.destinos.length - 2}`
}

/** Uma carga costuma ter várias notas; 1 NF-e é caso raro, não erro. */
function notas(ordem: OrdemDespacho): string {
  return `${ordem.notas.length} ${ordem.notas.length === 1 ? "nota" : "notas"}`
}

/**
 * Aba "Ordens de despacho": a **carga** de cada dia, ou seja, as NF-e que
 * saíram no mesmo dia pela mesma transportadora. Uma ordem tem várias notas,
 * de vários pedidos e pode ter entrega em mais de um destino.
 *
 * Os dados vêm dos campos `nf_od_*` que o relatório de CT-e já traz por NF-e —
 * nenhuma requisição extra. Consequência: só aparecem ordens cujas notas também
 * têm CT-e na janela carregada.
 */
export const AbaOrdensDespacho = memo(function AbaOrdensDespacho({ ordens, resumo }: AbaProps) {
  const [expandido, setExpandido] = useState<Set<string>>(new Set())
  const [visiveis, setVisiveis] = useState(ORDENS_POR_PAGINA)

  // Recorte novo (período, transportadora, região, busca) volta à 1ª página: a
  // lista é a mais recente primeiro, então continuar de onde parou levaria o
  // usuário ao fim da lista nova.
  useEffect(() => setVisiveis(ORDENS_POR_PAGINA), [ordens])

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

  const lista = ordens.slice(0, visiveis)
  const restantes = ordens.length - lista.length

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {card(
          "Ordens de despacho",
          formatarNumero(resumo.ordens),
          `${resumo.romaneios} romaneio(s)`
        )}
        {card(
          "Notas despachadas",
          formatarNumero(resumo.notas),
          `${resumo.transportadoras} transportadora(s)`
        )}
        {card(
          "Volumes (rolos)",
          resumo.volumes != null ? formatarNumero(resumo.volumes) : "-",
          "1 volume = 1 rolo"
        )}
        {card(
          "Metros",
          formatarNumero(resumo.metros),
          resumo.semDespacho > 0 ? `${resumo.semDespacho} NF-e sem despacho` : undefined
        )}
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Uma ordem por <strong>transportadora + dia</strong>: as notas que saíram juntas, da mais
          recente para a mais antiga. Total despachado{" "}
          <strong className="text-slate-700 dark:text-slate-200">
            {formatarMoeda(resumo.valor)}
          </strong>
          .
        </p>
      </div>

      <div className="space-y-2">
        {lista.map((ordem) => {
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
                      {ordem.data ?? "sem data"}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {notas(ordem)}
                    </span>
                    {ordem.romaneios.length > 0 && (
                      <span className="text-xs text-slate-400">
                        {ordem.romaneios.length === 1
                          ? `Romaneio ${ordem.romaneios[0]}`
                          : `${ordem.romaneios.length} romaneios`}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Truck size={12} />
                      {ordem.transportadora || "sem transportadora"}
                    </span>
                    <span>{`· ${destinos(ordem)}`}</span>
                    {ordem.regioes.length === 1 && <span>({ordem.regioes[0]})</span>}
                  </span>
                  <span className="mt-1.5 block text-xs text-slate-600 dark:text-slate-300">
                    {ordem.volumes != null
                      ? `${formatarNumero(ordem.volumes)} volume(s)`
                      : "volume(s) não informado(s)"}
                    {` · ${formatarNumero(ordem.metros)} m`}
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
                        <th
                          scope="col"
                          className="px-4 py-2 text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400"
                        >
                          Nota
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400"
                        >
                          Pedido
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400"
                        >
                          Romaneio
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400"
                        >
                          Destino
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-right text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400"
                        >
                          Volumes
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-right text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400"
                        >
                          Metros
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-right text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400"
                        >
                          Valor
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
                            {nota.pedido ?? "—"}
                          </td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                            {nota.romaneio ?? "—"}
                          </td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                            {nota.cliente ? `${nota.cliente} · ${nota.cidade}` : nota.cidade || "—"}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-slate-700 dark:text-slate-200">
                            {nota.repetido ? (
                              <span
                                className="text-slate-300 dark:text-slate-600"
                                title="Volumes e peso são do pedido/romaneio e já entraram na 1ª nota deste romaneio — contam uma vez só"
                              >
                                —
                              </span>
                            ) : (
                              formatarNumero(nota.volumes)
                            )}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-slate-700 dark:text-slate-200">
                            {formatarNumero(nota.metros)}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-slate-700 dark:text-slate-200">
                            {formatarMoeda(nota.valor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="px-4 py-2 text-[11px] text-slate-400">
                    Metros e valor são de cada nota. Volumes (rolos) e peso são totais do
                    pedido/romaneio e aparecem uma vez só, na 1ª nota — por isso o travessão nas
                    demais do mesmo romaneio.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {restantes > 0 && (
        <button
          type="button"
          onClick={() => setVisiveis((v) => v + ORDENS_POR_PAGINA)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {`Mostrar mais ${restantes} carga(s)`}
          <span className="ml-1 font-normal text-slate-500 dark:text-slate-400">
            {`(mostrando ${lista.length} de ${ordens.length})`}
          </span>
        </button>
      )}

      <p className="text-xs text-slate-400">
        Base: campos de despacho do relatório de CT-e (<code>nf_od_*</code>), ou seja apenas notas
        que também têm CT-e na janela carregada.
      </p>
    </div>
  )
})