"use client"

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { matchesSearch } from "@/components/ui/list-filters"
import {
  CheckCircle2, XCircle, Clock, Search, RefreshCw, FileText, Loader2, RotateCw,
  X, ArrowUp, ArrowDown, ArrowUpDown, Play, Eye, MousePointerClick, Download,
} from "lucide-react"
import { exportPDFRelatorio } from "@/lib/export-utils"
import { CriarListaModal, type TipoLista } from "./criar-lista-modal"
import type { HistoricoData, Disparo } from "../types"

type SortField = "status" | "email" | "nome" | "assunto" | "totalCliques" | "createdAt" | "abertoEm" | "error"

function SortableHeader({
  field,
  label,
  sortField,
  sortDir,
  onSort,
  className,
}: {
  field: SortField
  label: string
  sortField: SortField | null
  sortDir: "asc" | "desc"
  onSort: (field: SortField) => void
  className?: string
}) {
  const active = sortField === field
  return (
    <th
      className={`p-2 ${className || ""}`}
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
      >
        {label}
        {active ? (
          sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
        ) : (
          <ArrowUpDown size={12} className="opacity-40" />
        )}
      </button>
    </th>
  )
}

function StatusBadge({ status, abertoEm }: { status: string; abertoEm: string | null }) {
  if (abertoEm) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle2 size={12} /> Lido
      </span>
    )
  }
  if (status === "enviado") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        <Clock size={12} /> Enviado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <XCircle size={12} /> Falhou
    </span>
  )
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function EnvioRow({ e }: { e: any }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <td className="p-2">
        <StatusBadge status={e.status} abertoEm={e.abertoEm} />
      </td>
      <td className="p-2 text-slate-600 dark:text-slate-300 break-words">{e.email}</td>
      <td className="p-2 truncate">{e.nome || "—"}</td>
      <td className="p-2 text-slate-500 truncate">{e.assunto}</td>
      <td className="p-2 text-center">
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${e.totalCliques > 0 ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
          {e.totalCliques || 0}
        </span>
      </td>
      <td className="p-2 text-slate-500 text-xs whitespace-nowrap">{formatDate(e.createdAt)}</td>
      <td className="p-2 text-slate-500 text-xs whitespace-nowrap">{formatDate(e.abertoEm)}</td>
      <td className="p-2 text-red-500 text-xs truncate">{e.error || "—"}</td>
    </tr>
  )
}

const MemoEnvioRow = memo(EnvioRow)

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

  const gerarRelatorio = async (d: Disparo) => {
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
      const grupos = [
        { titulo: "Lidos", filtrar: (e: any) => !!e.abertoEm },
        { titulo: "Enviados", filtrar: (e: any) => !e.abertoEm && e.status === "enviado" },
        { titulo: "Pendentes", filtrar: (e: any) => e.status === "pendente" },
        { titulo: "Falhas", filtrar: (e: any) => e.status === "falhou" },
      ]
      const headersRelatorio = ["Email", "Nome", "Aberto em", "Enviado em", "Cliques", "Erro"]
      const linhaEnvio = (e: any) => [
        e.email,
        e.nome || "-",
        formatDate(e.abertoEm),
        formatDate(e.enviadoEm || e.createdAt),
        e.totalCliques || 0,
        e.error || "-",
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
                  <Button variant="outline" size="xs" onClick={() => setListaModal({ tipo: "lidos", disparo: d })} className="gap-1 active:opacity-70">
                    <Eye size={12} /> Lidos
                  </Button>
                  <Button variant="outline" size="xs" onClick={() => setListaModal({ tipo: "clicados", disparo: d })} className="gap-1 active:opacity-70">
                    <MousePointerClick size={12} /> Cliques
                  </Button>
                  <Button variant="outline" size="xs" onClick={() => setListaModal({ tipo: "falhas", disparo: d })} className="gap-1 active:opacity-70">
                    <XCircle size={12} /> Falhas
                  </Button>
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
  const [historicoSearch, setHistoricoSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [rowLimit, setRowLimit] = useState(50)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const handleSearchChange = useCallback((value: string) => {
    setHistoricoSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300)
  }, [])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  useEffect(() => {
    setRowLimit(50)
  }, [debouncedSearch])

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

  const filteredEnvios = useMemo(() => {
    const envios = historico?.envios || []
    let result = !debouncedSearch ? envios : envios.filter((e: any) => matchesSearch(e, debouncedSearch))
    if (!sortField) return result
    const dir = sortDir === "asc" ? 1 : -1
    return [...result].sort((a: any, b: any) => {
      const av = a[sortField]
      const bv = b[sortField]
      if (av == null && bv == null) return 0
      if (av == null) return dir
      if (bv == null) return -dir
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir
      const as = String(av).toLowerCase()
      const bs = String(bv).toLowerCase()
      return as < bs ? -dir : as > bs ? dir : 0
    })
  }, [historico, debouncedSearch, sortField, sortDir])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir(field === "totalCliques" || field === "createdAt" || field === "abertoEm" ? "desc" : "asc")
    }
  }

  const visibleEnvios = useMemo(() => filteredEnvios.slice(0, rowLimit), [filteredEnvios, rowLimit])

  const clearSearch = () => {
    setHistoricoSearch("")
    setDebouncedSearch("")
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }

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
                    rows: filteredEnvios.map((e: any) => [
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
          <div className="flex flex-col space-y-4">
            <DisparosSection />

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold mt-1">{historico.stats.total}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-500 uppercase tracking-wide">Enviados</p>
                <p className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-300">{historico.stats.enviados}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-500 uppercase tracking-wide">Lidos</p>
                <p className="text-2xl font-bold mt-1 text-green-700 dark:text-green-300">{historico.stats.lidos}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-500 uppercase tracking-wide">Cliques</p>
                <p className="text-2xl font-bold mt-1 text-purple-700 dark:text-purple-300">{historico.stats.totalCliques}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-500 uppercase tracking-wide">Falhas</p>
                <p className="text-2xl font-bold mt-1 text-red-700 dark:text-red-300">{historico.stats.falhas}</p>
              </div>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={historicoSearch}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Buscar por email, nome ou assunto..."
                className="pl-9 pr-8"
                aria-label="Buscar no histórico"
              />
              {historicoSearch && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Limpar busca"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {filteredEnvios.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">
                {debouncedSearch ? "Nenhum envio encontrado para esta busca." : "Nenhum envio registrado ainda."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed min-w-[820px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <SortableHeader field="status" label="Status" className="w-[76px]" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                      <SortableHeader field="email" label="Email" className="w-[24%]" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                      <SortableHeader field="nome" label="Nome" className="w-[16%]" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                      <SortableHeader field="assunto" label="Assunto" className="w-[18%]" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                      <SortableHeader field="totalCliques" label="Cliques" className="text-center w-20" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                      <SortableHeader field="createdAt" label="Enviado em" className="w-[118px]" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                      <SortableHeader field="abertoEm" label="Aberto em" className="w-[118px]" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                      <SortableHeader field="error" label="Erro" className="w-[13%]" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEnvios.map((e: any) => (
                      <MemoEnvioRow key={e.id} e={e} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredEnvios.length > rowLimit && (
              <div className="flex items-center justify-center gap-3">
                <p className="text-xs text-slate-400">
                  Mostrando {rowLimit} de {filteredEnvios.length} envios
                </p>
                <Button variant="outline" size="sm" onClick={() => setRowLimit(r => r + 100)} className="gap-1 active:opacity-70">
                  <ArrowDown size={14} /> Mostrar mais
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-8 text-center">Nenhum envio registrado ainda.</p>
        )}
      </div>
    </div>
  )
}

export default HistoricoTab
