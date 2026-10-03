"use client"

import { useEffect, useState } from "react"
import { Download, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { BadgeFaixaFrete } from "./dashboard"
import { gerarPdfCtes, type OrientacaoCtePdf } from "./cte-pdf"
import { classificarFaixaFrete, formatarMoeda, formatarPercentual, freteCte } from "./utils"
import type { GrupoCte } from "./types"

interface ModalCtesProps {
  /** Recorte que originou o modal, usado no título ("CT-es — Schenker"). */
  titulo: string
  grupos: GrupoCte[]
  onClose: () => void
}

/**
 * CT-es na tela por vez. O drill-down "Todos os CT-es" do período de 12 meses
 * são ~900 linhas: montar a tabela inteira custava 442 ms de INP (trace de
 * produção, 03/10/2026). A seleção e o PDF continuam valendo sobre o recorte
 * inteiro — a página é só o que está desenhado.
 */
const CTES_POR_PAGINA = 50

/**
 * Drill-down do dashboard: a lista de CT-es de um recorte (transportadora,
 * região, faixa de frete ou o filtro inteiro), com seleção para gerar o PDF
 * consolidado. Mesma ideia do romaneio — marcar e gerar.
 */
export function ModalCtes({ titulo, grupos, onClose }: ModalCtesProps) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [orient, setOrient] = useState<OrientacaoCtePdf>("portrait")
  const [gerando, setGerando] = useState(false)
  const [visiveis, setVisiveis] = useState(CTES_POR_PAGINA)

  // Outro recorte abre de novo na primeira página.
  useEffect(() => setVisiveis(CTES_POR_PAGINA), [grupos])

  const todosSelecionados = grupos.length > 0 && selecionados.size === grupos.length

  function alternar(chave: string) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(chave)) next.delete(chave)
      else next.add(chave)
      return next
    })
  }

  function alternarTodos() {
    setSelecionados(todosSelecionados ? new Set() : new Set(grupos.map((g) => g.chave)))
  }

  async function gerarPdf() {
    const escolhidos = grupos.filter((g) => selecionados.has(g.chave))
    if (escolhidos.length === 0) {
      toast.error("Selecione ao menos um CT-e")
      return
    }
    setGerando(true)
    try {
      await gerarPdfCtes(escolhidos, orient)
      toast.success(`PDF com ${escolhidos.length} CT-e gerado!`)
    } catch (err) {
      toast.error(
        `Erro ao gerar PDF: ${err instanceof Error ? err.message : "desconhecido"}`
      )
    } finally {
      setGerando(false)
    }
  }

  const rotulo = `${grupos.length} CT-e`
  const pagina = grupos.slice(0, visiveis)
  const restantes = grupos.length - pagina.length

  return (
    <Dialog
      open
      onOpenChange={(aberto) => {
        if (!aberto) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] w-full max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <div>
            <DialogTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {titulo}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              {rotulo} no recorte
            </DialogDescription>
          </div>
          <DialogClose
            aria-label="Fechar lista de CT-es"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </DialogClose>
        </div>

        {grupos.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhum CT-e neste recorte.
          </p>
        ) : (
          <div className="overflow-auto p-4">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th scope="col" className="py-2 pr-2 text-left">
                    <input
                      type="checkbox"
                      checked={todosSelecionados}
                      onChange={alternarTodos}
                      aria-label="Selecionar todos os CT-es"
                      className="rounded"
                    />
                  </th>
                  <th
                    scope="col"
                    className="py-2 pr-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400"
                  >
                    CT-e
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400"
                  >
                    Emissão
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400"
                  >
                    Transportadora
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400"
                  >
                    NF-e
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400"
                  >
                    Mercadoria
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400"
                  >
                    Frete
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400"
                  >
                    % CT-e sobre a nota
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagina.map((g) => {
                  const pct = g.pctSobreNf ?? g.pctCalculado
                  return (
                    <tr
                      key={g.chave}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800/60"
                    >
                      <td className="py-2 pr-2">
                        <input
                          type="checkbox"
                          checked={selecionados.has(g.chave)}
                          onChange={() => alternar(g.chave)}
                          aria-label={`Selecionar CT-e ${g.numero ?? g.chave}`}
                          className="rounded"
                        />
                      </td>
                      <td className="py-2 pr-3 font-medium text-slate-700 dark:text-slate-200">
                        {g.numero}
                        {g.serie ? `/${g.serie}` : ""}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{g.data ?? "—"}</td>
                      <td className="max-w-[220px] truncate px-3 py-2 text-slate-600 dark:text-slate-300">
                        {g.transportadora}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {g.nfs.length}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {formatarMoeda(g.somaNf ?? g.somaNfCalculada)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {formatarMoeda(freteCte(g))}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <BadgeFaixaFrete
                          faixa={classificarFaixaFrete(pct)}
                          pct={pct}
                          compacto
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {restantes > 0 && (
              <button
                type="button"
                onClick={() => setVisiveis((v) => v + CTES_POR_PAGINA)}
                className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {`Mostrar mais ${restantes} CT-e(s)`}
                <span className="ml-1 font-normal text-slate-500 dark:text-slate-400">
                  {`(mostrando ${pagina.length} de ${grupos.length})`}
                </span>
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {selecionados.size} de {grupos.length} selecionado(s) ·{" "}
            {formatarPercentual(percentualDosSelecionados(grupos, selecionados))} de frete sobre
            mercadoria
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="cte-pdf-orientacao" className="text-xs text-slate-500 dark:text-slate-400">
              Orientação
            </label>
            <select
              id="cte-pdf-orientacao"
              value={orient}
              onChange={(e) => setOrient(e.target.value as OrientacaoCtePdf)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="portrait">Retrato</option>
              <option value="landscape">Paisagem</option>
            </select>
            <button
              type="button"
              onClick={gerarPdf}
              disabled={gerando || selecionados.size === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {gerando ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Gerar PDF ({selecionados.size})
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Frete ÷ mercadoria dos CT-es marcados — o mesmo cálculo do card de resumo. */
function percentualDosSelecionados(
  grupos: GrupoCte[],
  selecionados: Set<string>
): number | null {
  const escolhidos = grupos.filter((g) => selecionados.has(g.chave))
  const mercadoria = escolhidos.reduce(
    (t, g) => t + (g.somaNf ?? g.somaNfCalculada),
    0
  )
  if (mercadoria <= 0) return null
  const frete = escolhidos.reduce((t, g) => t + (freteCte(g) ?? 0), 0)
  return (frete / mercadoria) * 100
}