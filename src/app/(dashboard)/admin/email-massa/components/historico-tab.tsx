"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  CheckCircle2, XCircle, Clock, RefreshCw, FileText, Loader2, RotateCw,
  Play, Download, ChevronDown, ClipboardList,
} from "lucide-react"
import { exportPDFRelatorio } from "@/lib/export-utils"
import { CriarListaModal, type TipoLista } from "./criar-lista-modal"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import type { HistoricoData, Disparo } from "../types"

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function temDisparoAtivo(dados: Disparo[]) {
  return dados.some((d) => d.status === "fila" || d.status === "enviando" || d.status === "pausado")
}

function statusLabel(status: string) {
  if (status === "fila") return "Na fila"
  if (status === "enviando") return "Enviando"
  if (status === "pausado") return "Pausado"
  if (status === "concluido") return "Concluído"
  if (status === "erro") return "Erro"
  return status
}

function DisparoStatusBadge({ status }: { status: string }) {
  if (status === "fila" || status === "enviando") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        <Loader2 size={12} className="animate-spin" /> {status === "fila" ? "Na fila" : "Enviando"}
      </span>
    )
  }
  if (status === "pausado") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <Clock size={12} /> Pausado
      </span>
    )
  }
  if (status === "concluido") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle2 size={12} /> Concluído
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <XCircle size={12} /> Erro
    </span>
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

function DisparosSection() {
  const queryClient = useQueryClient()
  const [processando, setProcessando] = useState(false)
  const [atualizando, setAtualizando] = useState(false)

  const { data: disparos = [], isLoading: loadingDisparos } = useQuery<Disparo[]>({
    queryKey: ["email-massa-disparos"],
    queryFn: async () => {
      const res = await fetch("/api/admin/email-massa/disparos")
      if (!res.ok) return []
      const data = await res.json()
      return data.disparos || []
    },
    refetchInterval: (query) => (temDisparoAtivo(query.state.data || []) ? 5000 : false),
  })

  const continuarEnvio = async () => {
    if (processando) return
    setProcessando(true)
    try {
      const res = await fetch("/api/admin/email-massa/processar", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erro ao processar envios")
        return
      }
      const partes: string[] = []
      if (data.enviados) partes.push(`${data.enviados} enviado(s)`)
      if (data.falhas) partes.push(`${data.falhas} falha(s)`)
      if (data.restantes) partes.push(`${data.restantes} restante(s)`)
      toast.success(partes.length ? `Envio processado: ${partes.join(", ")}` : "Nenhum envio pendente na fila")
    } catch {
      toast.error("Erro ao processar envios")
    } finally {
      setProcessando(false)
      queryClient.invalidateQueries({ queryKey: ["email-massa-disparos"] })
      queryClient.invalidateQueries({ queryKey: ["email-massa-historico"] })
    }
  }

  const reenfileirar = async (d: Disparo) => {
    try {
      const res = await fetch(`/api/admin/email-massa/disparos/${d.id}/reenfileirar`, { method: "POST" })
      if (res.ok) {
        toast.success("Disparo reenfileirado")
        queryClient.invalidateQueries({ queryKey: ["email-massa-disparos"] })
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao reenfileirar")
      }
    } catch {
      toast.error("Erro ao reenfileirar")
    }
  }

  const atualizarCards = async () => {
    if (atualizando) return
    setAtualizando(true)
    try {
      await queryClient.refetchQueries({ queryKey: ["email-massa-disparos"] })
    } finally {
      setAtualizando(false)
    }
  }

  const [listaModal, setListaModal] = useState<{ tipo: TipoLista; disparo: Disparo } | null>(null)
  const [relatorioLoading, setRelatorioLoading] = useState<number | null>(null)
  const [sincronizando, setSincronizando] = useState(false)

  type TipoPdf = "enviados" | "lidos" | "cliques" | "falhas"

  const gerarRelatorio = async (d: Disparo, tipo?: TipoPdf) => {
    if (relatorioLoading !== null) return
    setRelatorioLoading(d.id)
    try {
      const res = await fetch(`/api/admin/email-massa/disparos/${d.id}/relatorio`)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erro ao gerar relatório")
        return
      }
      const total = Number(data.disparo.total) || 0
      const processados = Number(data.stats?.enviados || 0) + Number(data.stats?.falhas || 0)
      const perc = total > 0 ? Math.round((processados / total) * 100) : 0

      const envios = data.envios || []
      const headersRelatorio = ["Email", "Nome", "Aberto em", "Enviado em", "Cliques", "Erro"]
      const linhaEnvio = (e: any) => [
        e.email,
        e.nome || "-",
        formatDate(e.abertoEm),
        formatDate(e.enviadoEm || e.createdAt),
        e.totalCliques || 0,
        e.error || "-",
      ]

      if (tipo) {
        const filtros: Record<TipoPdf, (e: any) => boolean> = {
          lidos: (e: any) => !!e.abertoEm,
          enviados: (e: any) => !e.abertoEm && e.status === "enviado",
          cliques: (e: any) => (e.totalCliques || 0) > 0,
          falhas: (e: any) => e.status === "falhou",
        }
        const label: Record<TipoPdf, string> = {
          lidos: "Lidos", enviados: "Enviados", cliques: "Cliques", falhas: "Falhas",
        }
        const linhas = envios.filter(filtros[tipo])
        exportPDFRelatorio({
          title: `${label[tipo]} do Disparo #${d.id} — ${d.nome || d.assunto}`,
          period: `Enviado em ${formatDate(d.criadoEm)} · Status: ${statusLabel(d.status)} · Processamento: ${perc}%`,
          stats: { [label[tipo]]: linhas.length },
          tables: linhas.length
            ? [{ title: `${label[tipo]} (${linhas.length})`, headers: headersRelatorio, rows: linhas.map(linhaEnvio) }]
            : [],
          filename: `relatorio-disparo-${d.id}-${tipo}-${new Date().toISOString().split("T")[0]}`,
          orientation: "landscape",
        })
        return
      }

      const grupos = [
        { titulo: "Lidos", filtrar: (e: any) => !!e.abertoEm },
        { titulo: "Enviados", filtrar: (e: any) => !e.abertoEm && e.status === "enviado" },
        { titulo: "Pendentes", filtrar: (e: any) => e.status === "pendente" },
        { titulo: "Falhas", filtrar: (e: any) => e.status === "falhou" },
      ]

      exportPDFRelatorio({
        title: `Relatório do Disparo #${d.id} — ${d.nome || d.assunto}`,
        period: `Enviado em ${formatDate(d.criadoEm)} · Status: ${statusLabel(d.status)} · Processamento: ${perc}%`,
        stats: {
          Total: total,
          Enviados: data.stats?.enviados || 0,
          Lidos: data.stats?.lidos || 0,
          Cliques: data.stats?.totalCliques || 0,
          Clicados: data.stats?.clicados || 0,
          Falhas: data.stats?.falhas || 0,
          Pendentes: data.stats?.pendentes || 0,
        },
        tables: [
          ...grupos.flatMap((g) => {
            const linhas = envios.filter(g.filtrar)
            return linhas.length
              ? [{ title: `${g.titulo} (${linhas.length})`, headers: headersRelatorio, rows: linhas.map(linhaEnvio) }]
              : []
          }),
          ...(data.links.length
            ? [{ title: "Links mais clicados", headers: ["Link", "Cliques"], rows: data.links.map((l: any) => [l.urlOriginal, l.total]) }]
            : []),
        ],
        filename: `relatorio-disparo-${d.id}-${new Date().toISOString().split("T")[0]}`,
        orientation: "landscape",
      })
    } catch {
      toast.error("Erro ao gerar relatório")
    } finally {
      setRelatorioLoading(null)
    }
  }

  const sincronizarBounces = async () => {
    if (sincronizando) return
    setSincronizando(true)
    try {
      const res = await fetch("/api/admin/email-massa/bounces/sincronizar", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erro ao sincronizar bounces")
        return
      }
      if (data.erro) {
        toast.error(data.erro)
        return
      }
      if (data.marcados > 0) {
        toast.success(`${data.marcados} bounce(s) identificado(s) e marcado(s) como falha${data.processados ? ` em ${data.processados} notificação(ões) lida(s)` : ""}`)
      } else {
        toast.info("Nenhum bounce novo encontrado")
      }
      queryClient.invalidateQueries({ queryKey: ["email-massa-disparos"] })
      queryClient.invalidateQueries({ queryKey: ["email-massa-historico"] })
    } catch {
      toast.error("Erro ao sincronizar bounces")
    } finally {
      setSincronizando(false)
    }
  }

  return (
    <section className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Disparos Recentes</h3>
        <Button variant="outline" size="sm" onClick={sincronizarBounces} disabled={sincronizando} className="gap-1 active:opacity-70">
          {sincronizando ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Sincronizar bounces
        </Button>
      </div>

      {loadingDisparos ? (
        <p className="text-sm text-slate-400 py-4 text-center">Carregando...</p>
      ) : disparos.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">Nenhum disparo registrado ainda.</p>
      ) : (
        <div className="flex flex-col space-y-2">
          {disparos.slice(0, 10).map((d) => {
            const total = Number(d.total)
            const processados = Number(d.enviados) + Number(d.falhas)
            const perc = total > 0 ? Math.round((processados / total) * 100) : 0
            const emAndamento = d.status === "fila" || d.status === "enviando" || d.status === "pausado"
            return (
              <div key={d.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex flex-col space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <DisparoStatusBadge status={d.status} />
                    <span className="text-sm font-medium truncate">{d.nome || d.assunto}</span>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(d.criadoEm)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-1.5 rounded-full ${d.status === "pausado" ? "bg-amber-500" : emAndamento ? "bg-blue-500" : d.falhas > 0 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${perc}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-14 text-right whitespace-nowrap">{perc}%</span>
                </div>
                <p className="text-xs text-slate-400">
                  {processados} de {total} &middot; {d.enviados} enviados &middot; {d.falhas} falhas &middot; {d.pendentes} na fila
                  {(d.status === "erro" || d.status === "pausado") && d.erro ? (
                    <> &middot; <span className={d.status === "erro" ? "text-red-500" : "text-amber-600 dark:text-amber-400"}>{d.erro}</span></>
                  ) : null}
                </p>
                <div className="flex flex-wrap gap-2">
                  <MiniStat label="Total" value={Number(d.total) || 0} className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                  <MiniStat label="Enviados" value={Number(d.enviados) || 0} className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300" />
                  <MiniStat label="Lidos" value={Number(d.lidos) || 0} className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300" />
                  <MiniStat label="Cliques" value={Number(d.cliques) || 0} className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300" />
                  <MiniStat label="Falhas" value={Number(d.falhas) || 0} className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(d.status === "erro" || d.status === "pausado") && (
                    <Button variant="outline" size="xs" onClick={() => reenfileirar(d)} className="gap-1 active:opacity-70">
                      <RotateCw size={12} /> Reenviar
                    </Button>
                  )}
                  {d.status !== "concluido" && (
                    <Button variant="outline" size="xs" onClick={continuarEnvio} disabled={processando} className="gap-1 active:opacity-70">
                      {processando ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Continuar envio
                    </Button>
                  )}
                  <Button variant="outline" size="xs" onClick={() => gerarRelatorio(d)} disabled={relatorioLoading !== null} className="gap-1 active:opacity-70">
                    {relatorioLoading === d.id ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />} Relatório
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="outline" size="xs" disabled={relatorioLoading !== null} className="gap-1 active:opacity-70">
                      <FileText size={12} /> PDF <ChevronDown size={12} />
                    </Button>} />
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => gerarRelatorio(d, "enviados")}>Enviados</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => gerarRelatorio(d, "lidos")}>Lidos</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => gerarRelatorio(d, "cliques")}>Cliques</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => gerarRelatorio(d, "falhas")}>Falhas</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="outline" size="xs" className="gap-1 active:opacity-70">
                      <ClipboardList size={12} /> Criar lista <ChevronDown size={12} />
                    </Button>} />
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => setListaModal({ tipo: "lidos", disparo: d })}>Lidos</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setListaModal({ tipo: "clicados", disparo: d })}>Cliques</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setListaModal({ tipo: "falhas", disparo: d })}>Falhas</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="xs" onClick={atualizarCards} disabled={atualizando} className="gap-1 active:opacity-70">
                    {atualizando ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Atualizar
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CriarListaModal
        open={!!listaModal}
        onOpenChange={(open) => { if (!open) setListaModal(null) }}
        tipo={listaModal?.tipo || "lidos"}
        disparo={listaModal?.disparo || null}
      />
    </section>
  )
}

export function HistoricoTab() {
  const queryClient = useQueryClient()

  const { data: historico = null, isLoading: loadingHistorico } = useQuery<HistoricoData | null>({
    queryKey: ["email-massa-historico"],
    queryFn: async () => {
      const res = await fetch("/api/admin/email-massa/historico")
      if (!res.ok) return null
      return res.json()
    },
    refetchInterval: () => {
      const disparos = queryClient.getQueryData<Disparo[]>(["email-massa-disparos"]) || []
      return temDisparoAtivo(disparos) ? 5000 : false
    },
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["email-massa-historico"] })
  }

  return (
    <div className="w-full rounded-xl border bg-card text-card-foreground shadow">
      <div className="p-6 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Histórico de Envios</h2>
          <div className="flex gap-2">
            {historico && (
              <Button variant="outline" size="sm" onClick={() => {
                exportPDFRelatorio({
                  title: "Relatório de Email em Massa",
                  period: `Exportado em ${new Date().toLocaleString("pt-BR")}`,
                  stats: {
                    Total: historico.stats.total,
                    Enviados: historico.stats.enviados,
                    Lidos: historico.stats.lidos,
                    Cliques: historico.stats.totalCliques,
                    Falhas: historico.stats.falhas,
                  },
                  tables: [{
                    headers: ["Status", "Email", "Nome", "Assunto", "Cliques", "Enviado em", "Aberto em"],
                    rows: (historico.envios || []).map((e: any) => [
                      e.abertoEm ? "Lido" : e.status === "enviado" ? "Enviado" : "Falhou",
                      e.email,
                      e.nome || "-",
                      e.assunto,
                      e.totalCliques || 0,
                      formatDate(e.createdAt),
                      formatDate(e.abertoEm),
                    ]),
                  }],
                  filename: `relatorio-email-massa-${new Date().toISOString().split("T")[0]}`,
                  orientation: "landscape",
                })
              }} className="gap-1">
                <FileText size={14} /> Relatório PDF
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={refresh} className="gap-1 active:opacity-70">
              <RefreshCw size={14} /> Atualizar
            </Button>
          </div>
        </div>

        {loadingHistorico ? (
          <p className="text-sm text-slate-400 py-8 text-center">Carregando...</p>
        ) : historico ? (
          <DisparosSection />
        ) : (
          <p className="text-sm text-slate-400 py-8 text-center">Nenhum envio registrado ainda.</p>
        )}
      </div>
    </div>
  )
}

export default HistoricoTab
