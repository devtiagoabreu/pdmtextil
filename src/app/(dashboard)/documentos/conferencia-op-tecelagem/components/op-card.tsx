import { ChevronDown, ChevronUp, Hash, Package, ScanLine } from "lucide-react"
import type { GrupoOp } from "./types"
import { formatarData, formatarMetragem, formatarPeso } from "./utils"

interface OpCardProps {
  grupo: GrupoOp
  expanded: boolean
  onToggleExpand: () => void
}

export function OpCard({ grupo, expanded, onToggleExpand }: OpCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="shrink-0 inline-flex p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <ScanLine size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                  OP {grupo.op}
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-medium">
                  {grupo.totalRolos} rolo(s)
                </span>
                {grupo.capa.sit && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                    {grupo.capa.sit}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onToggleExpand}
            aria-label={expanded ? "Recolher" : "Expandir"}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {grupo.capa.pedido && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Hash size={14} className="shrink-0" />
              <span>Pedido: {grupo.capa.pedido}</span>
            </div>
          )}
          {grupo.capa.nomeOperador && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Package size={14} className="shrink-0" />
              <span className="truncate">Operador: {grupo.capa.nomeOperador}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="font-medium">Total:</span>
            <span>{formatarMetragem(grupo.totalMetragem)}</span>
            <span>·</span>
            <span>{formatarPeso(grupo.totalPesoBruto)}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-3 py-2.5 text-center text-[11px] font-medium text-slate-500 uppercase w-10">#</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500 uppercase">Cód. Rolo</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500 uppercase">Item</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500 uppercase">Lote Prod.</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-medium text-slate-500 uppercase">Metragem</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-medium text-slate-500 uppercase">P. Bruto</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-medium text-slate-500 uppercase">Endereço</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-medium text-slate-500 uppercase">Ins.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {grupo.rolos.map((rolo, idx) => (
                  <tr key={`${rolo.codigoRolo}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-3 py-2 text-sm text-slate-500 text-center font-mono text-[12px]">{idx + 1}</td>
                    <td className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-200 font-mono">
                      {rolo.codigoRolo || "—"}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-mono text-[12px]">
                      {rolo.item || "—"}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-mono">
                      {rolo.loteProduto || rolo.lote || "—"}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 text-right font-mono">
                      {formatarMetragem(rolo.quantidade)}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 text-right font-mono">
                      {formatarPeso(rolo.pesoBruto)}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 text-center font-mono">
                      {rolo.enderecoRolo || "—"}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 text-center font-mono">
                      {formatarData(rolo.dataInsercao)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-blue-50 dark:bg-blue-950/30 border-t-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <td className="px-3 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 text-center">
                    {grupo.totalRolos}
                  </td>
                  <td colSpan={3} className="px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                    Total da OP {grupo.op}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 text-right font-mono">
                    {formatarMetragem(grupo.totalMetragem)}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 text-right font-mono">
                    {formatarPeso(grupo.totalPesoBruto)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
