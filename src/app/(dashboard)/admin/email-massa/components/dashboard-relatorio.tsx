"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, BarChart3, RefreshCw, FileText, MousePointerClick, Download } from "lucide-react"
import { exportPDFRelatorio, exportCSV } from "@/lib/export-utils"
import { Button } from "@/components/ui/button"

type LinkRemessa = { urlOriginal: string; total: number }

type Remessa = {
  remessaId: string
  assunto: string
  createdAt: string
  total: number
  enviados: number
  falhas: number
  lidos: number
  clicados: number
  totalCliques: number
  links: LinkRemessa[]
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function SummaryCard({ label, value, sub, className }: { label: string; value: string | number; sub?: string; className?: string }) {
  return (
    <div className={`rounded-lg p-4 border ${className || ""}`}>
      <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub ? <p className="text-xs mt-0.5 opacity-70">{sub}</p> : null}
    </div>
  )
}

function MiniStat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={`rounded-lg border px-2.5 py-1 ${className || ""}`}>
      <p className="text-[10px] uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-sm font-bold leading-tight">{value}</p>
    </div>
  )
}

export function DashboardRelatorio() {
  const queryClient = useQueryClient()
  const [gerando, setGerando] = useState<string | null>(null)
  const [atualizando, setAtualizando] = useState(false)

  const { data: remessas = [], isLoading: loading } = useQuery<Remessa[]>({
    queryKey: ["email-massa-relatorio"],
    queryFn: async () => {
      const res = await fetch("/api/admin/email-massa/relatorio")
      if (!res.ok) throw new Error("Erro ao carregar")
      const data = await res.json()
      return data.remessas || []
    },
  })

  const totalEnviados = remessas.reduce((s, r) => s + Number(r.total), 0)
  const totalLidos = remessas.reduce((s, r) => s + Number(r.lidos), 0)
  const totalFalhas = remessas.reduce((s, r) => s + Number(r.falhas), 0)
  const totalClicados = remessas.reduce((s, r) => s + Number(r.clicados), 0)
  const totalCliques = remessas.reduce((s, r) => s + Number(r.totalCliques), 0)
  const naoLidos = totalEnviados - totalLidos
  const percAbertura = totalEnviados > 0 ? Math.round((totalLidos / totalEnviados) * 100) : 0
  const percNaoLidos = totalEnviados > 0 ? Math.round((naoLidos / totalEnviados) * 100) : 0
  const percClicados = totalLidos > 0 ? Math.round((totalClicados / totalLidos) * 100) : 0

  const linkHost = (url: string) => {
    try { return new URL(url).hostname } catch { return url }
  }

  const atualizar = async () => {
    if (atualizando) return
    setAtualizando(true)
    try {
      await queryClient.refetchQueries({ queryKey: ["email-massa-relatorio"] })
    } finally {
      setAtualizando(false)
    }
  }

  const gerarRelatorioGeral = async () => {
    if (gerando !== null) return
    setGerando("all")
    try {
      const linhasRemessas = remessas.map((r, idx) => {
        const total = Number(r.total)
        const lidos = Number(r.lidos)
        const perc = total > 0 ? Math.round((lidos / total) * 100) : 0
        return [
          `Remessa #${remessas.length - idx}`,
          formatDate(r.createdAt),
          r.assunto || "-",
          total,
          lidos,
          `${perc}%`,
          Number(r.clicados),
          Number(r.totalCliques),
          Number(r.falhas),
        ]
      })
      exportPDFRelatorio({
        title: "Dashboard de Email em Massa",
        period: `Exportado em ${new Date().toLocaleString("pt-BR")} · ${remessas.length} remessa(s)`,
        stats: {
          "Total enviados": totalEnviados,
          Lidos: totalLidos,
          "Taxa de abertura": `${percAbertura}%`,
          Clicados: totalClicados,
          Cliques: totalCliques,
          Falhas: totalFalhas,
        },
        tables: [
          { title: "Resumo por remessa", headers: ["Remessa", "Enviado em", "Assunto", "Enviados", "Lidos", "Abertura", "Clicados", "Cliques", "Falhas"], rows: linhasRemessas },
          ...remessas.flatMap((r, idx) =>
            (r.links && r.links.length > 0)
              ? [{ title: `Links — Remessa #${remessas.length - idx}`, headers: ["Link", "Cliques"], rows: r.links.map((l) => [l.urlOriginal, l.total]) }]
              : []
          ),
        ],
        filename: `dashboard-email-massa-${new Date().toISOString().split("T")[0]}`,
        orientation: "landscape",
      })
    } catch {
      toast.error("Erro ao gerar relatório")
    } finally {
      setGerando(null)
    }
  }

  const gerarRelatorioRemessa = async (r: Remessa, idx: number) => {
    if (gerando !== null) return
    setGerando(r.remessaId)
    try {
      const total = Number(r.total)
      const lidos = Number(r.lidos)
      const naoLidosRemessa = total - lidos
      const perc = total > 0 ? Math.round((lidos / total) * 100) : 0
      exportPDFRelatorio({
        title: `Relatório da Remessa #${remessas.length - idx} — ${r.assunto || "Email em Massa"}`,
        period: `Enviado em ${formatDate(r.createdAt)} · ${total} enviado(s) · ${perc}% de abertura`,
        stats: {
          Enviados: total,
          Lidos: lidos,
          "Não abertos": naoLidosRemessa,
          Clicados: Number(r.clicados),
          Cliques: Number(r.totalCliques),
          Falhas: Number(r.falhas),
        },
        tables: (r.links && r.links.length > 0)
          ? [{ title: `Links mais clicados (${r.links.length})`, headers: ["Link", "Cliques"], rows: r.links.map((l) => [l.urlOriginal, l.total]) }]
          : [],
        filename: `relatorio-remessa-${r.remessaId}-${new Date().toISOString().split("T")[0]}`,
        orientation: "landscape",
      })
    } catch {
      toast.error("Erro ao gerar relatório")
    } finally {
      setGerando(null)
    }
  }

  const exportarLinksCSV = (r: Remessa) => {
    exportCSV(
      `links-remessa-${r.remessaId}`,
      ["Link", "Cliques"],
      (r.links || []).map((l) => [l.urlOriginal, l.total])
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    )
  }

  if (remessas.length === 0) {
    return (
      <div className="py-16 text-center">
        <BarChart3 size={40} className="mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500 dark:text-slate-400">Nenhuma remessa encontrada. Envie emails para começar a gerar relatórios.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dashboard de Envios</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={gerarRelatorioGeral} disabled={gerando !== null} className="gap-1 active:opacity-70">
            {gerando === "all" ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} Relatório PDF
          </Button>
          <Button variant="outline" size="sm" onClick={atualizar} disabled={atualizando} className="gap-1 active:opacity-70">
            {atualizando ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <SummaryCard label="Total enviados" value={totalEnviados} sub={`${remessas.length} remessa(s)`} className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
        <SummaryCard label="Lidos" value={totalLidos} sub={`${percAbertura}% de abertura`} className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300" />
        <SummaryCard label="Não abertos" value={naoLidos} sub={`${percNaoLidos}%`} className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300" />
        <SummaryCard label="Pessoas clicaram" value={totalClicados} sub={`${percClicados}% dos lidos`} className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300" />
        <SummaryCard label="Cliques totais" value={totalCliques} className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300" />
        <SummaryCard label="Falhas" value={totalFalhas} className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300" />
      </div>

      <div className="flex flex-col space-y-2">
        {remessas.map((r, idx) => {
          const total = Number(r.total)
          const lidos = Number(r.lidos)
          const falhas = Number(r.falhas)
          const naoLidosRemessa = total - lidos
          const percLidos = total > 0 ? Math.round((lidos / total) * 100) : 0
          const percLink = (urlTotal: number) => (Number(r.totalCliques) > 0 ? Math.round((urlTotal / Number(r.totalCliques)) * 100) : 0)

          return (
            <div key={r.remessaId} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex flex-col space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Remessa #{remessas.length - idx}
                  </span>
                  <span className="text-sm font-medium truncate">{r.assunto || "Sem assunto"}</span>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(r.createdAt)}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${percLidos}%` }} />
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-14 text-right whitespace-nowrap">{percLidos}% lidos</span>
              </div>

              <p className="text-xs text-slate-400">
                {total} enviado{total !== 1 ? "s" : ""} &middot; {lidos} lido{ lidos !== 1 ? "s" : ""} &middot; {falhas} falha{falhas !== 1 ? "s" : ""}
              </p>

              <div className="flex flex-wrap gap-2">
                <MiniStat label="Enviados" value={total} className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                <MiniStat label="Lidos" value={lidos} className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300" />
                <MiniStat label="Não abertos" value={naoLidosRemessa} className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300" />
                <MiniStat label="Cliques" value={Number(r.totalCliques) || 0} className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300" />
                <MiniStat label="Falhas" value={falhas} className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300" />
              </div>

              {(r.links && r.links.length > 0) ? (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1.5">
                  <div className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <MousePointerClick size={14} /> Cliques em Links
                  </div>
                  {r.links.map((link, li) => (
                    <div key={li} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-24 truncate text-right flex-shrink-0">{linkHost(link.urlOriginal)}</span>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percLink(Number(link.total))}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-8 text-right flex-shrink-0">{Number(link.total)}</span>
                    </div>
                  ))}
                  <p className="text-xs text-slate-400 pt-1">
                    {Number(r.clicados)} {Number(r.clicados) === 1 ? "pessoa clicou" : "pessoas clicaram"} em link{Number(r.clicados) !== 1 ? "s" : ""} &middot; {Number(r.totalCliques)} clique{Number(r.totalCliques) !== 1 ? "s" : ""} no total
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Nenhum clique registrado nesta remessa.</p>
              )}

              <div className="flex items-center gap-2 flex-wrap pt-1">
                <Button variant="outline" size="xs" onClick={() => gerarRelatorioRemessa(r, idx)} disabled={gerando !== null} className="gap-1 active:opacity-70">
                  {gerando === r.remessaId ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />} Relatório
                </Button>
                <Button variant="outline" size="xs" onClick={() => exportarLinksCSV(r)} disabled={(r.links || []).length === 0} className="gap-1 active:opacity-70">
                  <Download size={12} /> Links CSV
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
