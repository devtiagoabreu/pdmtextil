"use client"

import { useState, useCallback, useEffect } from "react"
import { Loader2, BarChart3, MousePointerClick, CheckCircle2, XCircle, Clock } from "lucide-react"

export function DashboardRelatorio() {
  const [remessas, setRemessas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/email-massa/relatorio")
      if (!res.ok) throw new Error("Erro ao carregar")
      const data = await res.json()
      setRemessas(data.remessas || [])
    } catch { /* empty */ }
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-12 bg-white dark:bg-slate-900 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    )
  }

  if (remessas.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-12 bg-white dark:bg-slate-900 text-center">
        <BarChart3 size={40} className="mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500">Nenhuma remessa encontrada. Envie emails para começar a gerar relatórios.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {remessas.map((r, idx) => {
        const total = Number(r.total)
        const lidos = Number(r.lidos)
        const naoLidos = total - lidos
        const clicados = Number(r.clicados)
        const totalCliques = Number(r.totalCliques)
        const naoClicaram = lidos - clicados
        const percLidos = total > 0 ? Math.round((lidos / total) * 100) : 0

        return (
          <div key={r.remessaId} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    Remessa #{remessas.length - idx}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString("pt-BR") : ""}
                    {r.assunto ? <> &middot; {r.assunto}</> : null}
                  </p>
                </div>
                <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                  {total} enviado{total !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Enviados</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-50">{total}</div>
                  <div className="text-xs text-slate-400">{Number(r.falhas)} falha{Number(r.falhas) !== 1 ? "s" : ""}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Abertos</div>
                  <div className="text-lg font-bold text-green-700 dark:text-green-400">{lidos}</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${percLidos}%` }} />
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{percLidos}% de abertura</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Não abertos</div>
                  <div className="text-lg font-bold text-slate-500">{naoLidos}</div>
                  <div className="text-xs text-slate-400">{naoLidos > 0 ? `${Math.round((naoLidos / total) * 100)}%` : "—"}</div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  <MousePointerClick size={14} />
                  Cliques em Links
                </div>

                {(r.links && r.links.length > 0) ? (
                  <div className="space-y-2">
                    {r.links.map((link: any, li: number) => {
                      const linkTotal = Number(link.total)
                      const percLink = totalCliques > 0 ? Math.round((linkTotal / totalCliques) * 100) : 0
                      let label = link.urlOriginal
                      try { label = new URL(link.urlOriginal).hostname } catch { /* keep original */ }
                      return (
                        <div key={li} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-24 truncate text-right flex-shrink-0">{label}</span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percLink}%` }} />
                          </div>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-8 text-right flex-shrink-0">{linkTotal}</span>
                        </div>
                      )
                    })}
                    {naoClicaram > 0 && (
                      <div className="flex items-center gap-3 opacity-60">
                        <span className="text-xs text-slate-400 w-24 text-right flex-shrink-0">Não clicaram</span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                          <div className="bg-slate-300 dark:bg-slate-600 h-2 rounded-full" style={{ width: `${lidos > 0 ? Math.round((naoClicaram / lidos) * 100) : 0}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-400 w-8 text-right flex-shrink-0">{naoClicaram}</span>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {clicados} {clicados === 1 ? "pessoa clicou" : "pessoas clicaram"} em link{clicados !== 1 ? "s" : ""} &middot; {totalCliques} clique{totalCliques !== 1 ? "s" : ""} no total
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Nenhum clique registrado nesta remessa.</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
