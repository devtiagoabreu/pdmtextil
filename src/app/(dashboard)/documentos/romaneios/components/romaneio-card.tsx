import type { ReactNode } from "react"
import { ChevronDown, ChevronUp, FileText, Hash, MapPin, Package, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GrupoRomaneio, Rolo } from "./types"
import { formatarMetragem, formatarPeso } from "./utils"

interface RomaneioCardProps {
  grupo: GrupoRomaneio
  selected: boolean
  expanded: boolean
  gerandoPdf: boolean
  onToggle: () => void
  onToggleExpand: () => void
  onGerarPdf: () => void
}

export function RomaneioCard({
  grupo,
  selected,
  expanded,
  gerandoPdf,
  onToggle,
  onToggleExpand,
  onGerarPdf,
}: RomaneioCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggle}
              className="mt-1 rounded"
            />
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
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={onGerarPdf}
              disabled={gerandoPdf}
              className="gap-1 text-xs"
            >
              <FileText size={14} />
              PDF
            </Button>
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {expanded ? (
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
      </div>

      {expanded && (
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
                  <th className="px-4 py-2.5 text-center text-[11px] font-medium text-slate-500 uppercase">Largura</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-medium text-slate-500 uppercase">Endereço</th>
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
                  const prodsSorted = Array.from(prodsMap.entries()).sort((a: any, b: any) => a[0].localeCompare(b[0]))
                  const trs: ReactNode[] = []
                  for (const [prodNome, lotesMap] of prodsSorted) {
                    const lotsSorted = Array.from(lotesMap.entries()).sort((a: any, b: any) => a[0].localeCompare(b[0]))
                    let prodRolos = 0
                    let prodMetragem = 0
                    let prodPesoBruto = 0
                    let prodPesoLiquido = 0
                    trs.push(
                      <tr key={`prod-${prodNome}`} className="bg-purple-50 dark:bg-purple-950/20">
                        <td colSpan={10} className="px-4 py-2 text-sm font-bold text-purple-700 dark:text-purple-400">
                          PRODUTO: {prodNome}
                        </td>
                      </tr>
                    )
                    for (const [loteNome, rolos] of lotsSorted) {
                      let subMetragem = 0
                      let subPesoBruto = 0
                      let subPesoLiquido = 0
                      for (const r of rolos) {
                        subMetragem += r.quantidade || 0
                        subPesoBruto += r.peso_bruto || 0
                        subPesoLiquido += r.peso_liquido || 0
                      }
                      prodRolos += rolos.length
                      prodMetragem += subMetragem
                      prodPesoBruto += subPesoBruto
                      prodPesoLiquido += subPesoLiquido
                      trs.push(
                        <tr key={`lote-${prodNome}-${loteNome}`} className="bg-blue-50 dark:bg-blue-950/30">
                          <td colSpan={10} className="px-4 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                            LOTE {loteNome}
                          </td>
                        </tr>
                      )
                      rolos.forEach((rolo: any, idx: any) => {
                        trs.push(
                          <tr key={rolo.codigo_rolo} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-3 py-2 text-sm text-slate-500 text-center font-mono text-[12px]">{idx + 1}</td>
                            <td className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-200 font-mono">{rolo.codigo_rolo}</td>
                            <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-mono text-[12px]">{rolo.produto}</td>
                            <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={rolo.narrativa}>{rolo.narrativa}</td>
                            <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-mono">{rolo.lote_produto}</td>
                            <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 text-right font-mono">{formatarMetragem(rolo.quantidade)}</td>
                            <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 text-right font-mono">{formatarPeso(rolo.peso_bruto)}</td>
                            <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 text-right font-mono">{formatarPeso(rolo.peso_liquido)}</td>
                            <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 text-center">{rolo.largura ? `${rolo.largura.toFixed(1)}m` : "—"}</td>
                            <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 text-center font-mono">{rolo.endereco_rolo || "—"}</td>
                          </tr>
                        )
                      })
                      trs.push(
                        <tr key={`sub-lote-${prodNome}-${loteNome}`} className="bg-slate-50 dark:bg-slate-800/50">
                          <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 text-right">{rolos.length} rolo(s)</td>
                          <td></td>
                          <td className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right font-mono">{formatarMetragem(subMetragem)}</td>
                          <td className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right font-mono">{formatarPeso(subPesoBruto)}</td>
                          <td className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right font-mono">{formatarPeso(subPesoLiquido)}</td>
                          <td colSpan={2}></td>
                        </tr>
                      )
                    }
                    trs.push(
                      <tr key={`sub-prod-${prodNome}`} className="bg-purple-50 dark:bg-purple-950/20">
                        <td colSpan={5} className="px-4 py-2 text-sm font-bold text-purple-700 dark:text-purple-400">SUBTOTAL {prodNome}: {prodRolos} rolo(s)</td>
                        <td className="px-4 py-2 text-sm font-bold text-purple-700 dark:text-purple-400 text-right font-mono">{formatarMetragem(prodMetragem)}</td>
                        <td className="px-4 py-2 text-sm font-bold text-purple-700 dark:text-purple-400 text-right font-mono">{formatarPeso(prodPesoBruto)}</td>
                        <td className="px-4 py-2 text-sm font-bold text-purple-700 dark:text-purple-400 text-right font-mono">{formatarPeso(prodPesoLiquido)}</td>
                        <td colSpan={2}></td>
                      </tr>
                    )
                  }
                  return trs
                })()}
              </tbody>
              <tfoot className="bg-blue-50 dark:bg-blue-950/30 border-t-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <td className="px-3 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 text-center">
                    {grupo.totalRolos}
                  </td>
                  <td colSpan={3} className="px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                    Total Geral
                  </td>
                  <td></td>
                  <td className="px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 text-right font-mono">
                    {formatarMetragem(grupo.totalMetragem)}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 text-right font-mono">
                    {formatarPeso(grupo.totalPesoBruto)}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 text-right font-mono">
                    {formatarPeso(grupo.totalPesoLiquido)}
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
