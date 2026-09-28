import { ChevronDown, ChevronRight } from "lucide-react"
import type { GrupoCte } from "./types"
import { formatarMoeda, formatarNumero, formatarPercentual } from "./utils"

interface TabelaProps {
  grupos: GrupoCte[]
  expandido: Set<string>
  onToggle: (chave: string) => void
}

function rotuloNf(linha: GrupoCte["nfs"][number]): string {
  if (linha.nf_numero === null) return "NF sem número"
  return `NF ${linha.nf_numero}${linha.nf_serie ? `/${linha.nf_serie}` : ""}`
}

export function TabelaCte({ grupos, expandido, onToggle }: TabelaProps) {
  return (
    <div className="space-y-2">
      {grupos.map((grupo) => {
        const aberto = expandido.has(grupo.chave)
        const fornecedor = grupo.nfs.find((n) => n.nf_fornecedor_fantasia || n.nf_fornecedor_razao)
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
                </span>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                  {grupo.transportadora} · tomador {grupo.tomador}
                  {grupo.situacao !== null ? ` · situação ${grupo.situacao}` : ""}
                </span>
                <span className="mt-1.5 block text-xs text-slate-600 dark:text-slate-300">
                  Frete {formatarMoeda(grupo.valorTotal)}
                  {grupo.somaNf != null
                    ? ` · soma das NFs ${formatarMoeda(grupo.somaNf)}`
                    : grupo.somaNfCalculada > 0
                      ? ` · soma das NFs ${formatarMoeda(grupo.somaNfCalculada)} (calculada)`
                      : ""}
                  {grupo.pctSobreNf != null
                    ? ` · ${formatarPercentual(grupo.pctSobreNf)} das NFs`
                    : grupo.pctCalculado !== null
                      ? ` · ${formatarPercentual(grupo.pctCalculado)} das NFs (calculado)`
                      : ""}
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
                        Fornecedor
                      </th>
                      <th className="px-4 py-2 text-right text-[10px] font-medium uppercase text-slate-400">
                        Valor
                      </th>
                      <th className="px-4 py-2 text-right text-[10px] font-medium uppercase text-slate-400">
                        % no CT-e
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.nfs.map((linha, idx) => (
                      <tr
                        key={`${grupo.chave}-${linha.nf_numero ?? idx}-${linha.nf_serie ?? ""}`}
                        className="border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                      >
                        <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-200">
                          {rotuloNf(linha)}
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                          {linha.nf_data ?? "—"}
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                          {linha.nf_fornecedor_fantasia || linha.nf_fornecedor_razao || "—"}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-slate-900 dark:text-slate-100">
                          {formatarMoeda(linha.nf_valor_total)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-slate-600 dark:text-slate-300">
                          {formatarPercentual(linha.pct_nf_no_total_cte)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td
                        className="px-4 py-2 text-xs uppercase text-slate-400"
                        colSpan={3}
                      >
                        Total do CT-e
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {formatarNumero(grupo.nfs.length)} NF-e
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-slate-500 dark:text-slate-400">
                        {grupo.somaNf != null
                          ? formatarMoeda(grupo.somaNf)
                          : formatarMoeda(grupo.somaNfCalculada || null)}
                      </td>
                    </tr>
                  </tbody>
                </table>
                {!fornecedor && (
                  <p className="px-4 pb-3 text-xs text-amber-600 dark:text-amber-400">
                    Nenhuma NF deste CT-e tem fornecedor vinculado.
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
