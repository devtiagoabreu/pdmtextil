"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { BarChart3, Search, Clock, FileText, FlaskConical, CheckCircle, XCircle, AlertCircle, ExternalLink, Activity, History } from "lucide-react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { exportPDFRelatorio } from "@/lib/export-utils"
import Link from "next/link"

type TimelineEntry = {
  data: string
  tipo: "historico" | "log"
  usuario: string
  descricao: string
  detalhes?: string[]
  acao?: string
}

export default function HistoricoSolicitacaoPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get("id")

  const [solicitacao, setSolicitacao] = useState<any | null>(null)
  const [produtos, setProdutos] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [solicitacoesList, setSolicitacoesList] = useState<any[]>([])
  const [searchText, setSearchText] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [orientacao, setOrientacao] = useState<"portrait" | "landscape">("portrait")
  const searchRef = useRef<HTMLDivElement>(null)

  const fetchHistory = useCallback(async (id: number) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/relatorios/historico-solicitacao?id=${id}`)
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Erro ao carregar histórico")
        setSolicitacao(null)
        return
      }
      const data = await res.json()
      setSolicitacao(data.solicitacao)
      setProdutos(data.produtos || [])
      setLogs(data.logs || [])
    } catch {
      setError("Erro ao carregar histórico")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedId) fetchHistory(parseInt(selectedId))
  }, [selectedId, fetchHistory])

  useEffect(() => {
    fetch("/api/solicitacoes").then(r => r.json()).then(setSolicitacoesList).catch(() => {})
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filteredSolicitacoes = useMemo(() => {
    if (!searchText) return solicitacoesList.slice(0, 50)
    const q = searchText.toLowerCase()
    return solicitacoesList.filter((s: any) =>
      s.id.toString().includes(q) ||
      s.cliente.toLowerCase().includes(q) ||
      (s.projeto && s.projeto.toLowerCase().includes(q))
    ).slice(0, 50)
  }, [solicitacoesList, searchText])

  function selectSolicitacao(id: number) {
    setShowDropdown(false)
    setSearchText("")
    router.push(`${pathname}?id=${id}`)
  }

  const timeline = useMemo(() => {
    const entries: TimelineEntry[] = []
    if (solicitacao?.historicoComunicacao) {
      for (const h of solicitacao.historicoComunicacao) {
        let desc = ""
        let detalhes: string[] | undefined
        if (h.acao === "CRIACAO") desc = h.mensagem || "Solicitação criada"
        else if (h.acao === "MUDANCA_STATUS") desc = h.mensagem || `Status: ${h.de || "?"} → ${h.para || "?"}`
        else if (h.acao === "ALTERACAO" && h.mensagens?.length > 0) {
          desc = "Campos alterados"
          detalhes = h.mensagens
        } else desc = h.mensagens?.[0] || h.acao
        entries.push({ data: h.data, tipo: "historico", usuario: h.usuario || "Sistema", descricao: desc, detalhes, acao: h.acao })
      }
    }
    for (const l of logs) {
      entries.push({
        data: l.createdAt, tipo: "log", usuario: l.usuarioNome || "Sistema",
        descricao: l.descricao || `${l.acao} (${l.tipo})`, acao: l.acao,
        detalhes: l.dados ? [JSON.stringify(l.dados)] : undefined
      })
    }
    entries.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    return entries
  }, [solicitacao, logs])

  async function handleExportPDF() {
    if (!solicitacao) return
    const clienteLabel = solicitacao.cliente
    const tipoLabel = solicitacao.tipo === "DESENVOLVIMENTO_TECELAGEM" ? "Tecelagem" : "Beneficiamento"
    const statusLabel = solicitacao.status

    const amostraRows: (string | number | null | undefined)[][] = []
    for (const prod of produtos) {
      if (prod.amostras && prod.amostras.length > 0) {
        for (const a of prod.amostras) {
          amostraRows.push([prod.codigoPdm, a.descricao || `#${a.id}`, "Tecido Cru", a.status])
        }
      }
      if (prod.acabamentos) {
        for (const ac of prod.acabamentos) {
          if (ac.amostras && ac.amostras.length > 0) {
            for (const aa of ac.amostras) {
              amostraRows.push([prod.codigoPdm, aa.descricao || `#${aa.id}`, `${ac.tipoAcabamento}`, aa.status])
            }
          }
        }
      }
    }

    const timelineRows: (string | number | null | undefined)[][] = timeline.map((e) => [
      new Date(e.data).toLocaleString("pt-BR"),
      e.usuario,
      e.descricao,
    ])

    const tables: { headers: string[]; rows: (string | number | null | undefined)[][] }[] = []

    tables.push({
      headers: ["#", "Cliente", "Projeto", "Status", "Tipo", "Criado em", "Prazo"],
      rows: [[
        solicitacao.id,
        clienteLabel,
        solicitacao.projeto || "-",
        statusLabel,
        tipoLabel,
        solicitacao.createdAt ? new Date(solicitacao.createdAt).toLocaleDateString("pt-BR") : "-",
        solicitacao.prazoDesejado ? new Date(solicitacao.prazoDesejado).toLocaleDateString("pt-BR") : "-",
      ]]
    })

    if (amostraRows.length > 0) {
      tables.push({ headers: ["Produto", "Amostra", "Tipo", "Status"], rows: amostraRows })
    }

    if (timelineRows.length > 0) {
      tables.push({ headers: ["Data", "Usuário", "Evento"], rows: timelineRows })
    }

    await exportPDFRelatorio({
      title: `Histórico — Solicitação #${solicitacao.id}`,
      stats: {
        "Cliente": clienteLabel,
        "Status": statusLabel,
        "Tipo": tipoLabel,
        "Produtos": produtos.length,
        "Eventos": timeline.length,
      },
      tables,
      filename: `historico-solicitacao-${solicitacao.id}`,
      orientation: orientacao,
      statsLayout: "list",
    })
  }

  const info = getInfoContent(pathname)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Histórico de Solicitação{info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Acompanhe todo o histórico de uma solicitação: dados, produtos, amostras e timeline
        </p>
      </div>

      <div ref={searchRef} className="relative">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[260px] relative">
            <label className="block text-xs text-slate-400 mb-1">Buscar solicitação</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Digite ID, cliente ou projeto..."
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            {showDropdown && filteredSolicitacoes.length > 0 && (
              <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                {filteredSolicitacoes.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => selectSolicitacao(s.id)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">#{s.id}</span>{" "}
                    <span className="text-slate-600 dark:text-slate-400">{s.cliente}</span>
                    {s.projeto && <span className="text-slate-400 ml-2">({s.projeto})</span>}
                    <StatusBadge status={s.status} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Ou ID direto</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="#"
                className="w-20 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = parseInt((e.target as HTMLInputElement).value)
                    if (!isNaN(val)) selectSolicitacao(val)
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('input[type="number"]')
                  if (input) { const val = parseInt(input.value); if (!isNaN(val)) selectSolicitacao(val) }
                }}
                className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Buscar
              </button>
            </div>
          </div>
          {selectedId && (
            <>
              <div className="flex items-center gap-1 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm">
                <span className="text-xs text-slate-400 mr-1">PDF</span>
                <button
                  onClick={() => setOrientacao("portrait")}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${orientacao === "portrait" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Retrato
                </button>
                <button
                  onClick={() => setOrientacao("landscape")}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${orientacao === "landscape" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Paisagem
                </button>
                <button
                  onClick={handleExportPDF}
                  className="ml-1 px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Exportar
                </button>
              </div>
              <button onClick={() => router.push(pathname)} className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                Limpar
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 p-4 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {loading && <div className="text-center py-16 text-slate-500">Carregando histórico...</div>}

      {!selectedId && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BarChart3 className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4" />
          <p className="text-base font-medium text-slate-400 dark:text-slate-500">Selecione uma solicitação para ver o histórico completo</p>
        </div>
      )}

      {solicitacao && !loading && (
        <>
          {/* Header */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Solicitação #{solicitacao.id}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {solicitacao.cliente}{solicitacao.projeto && ` — ${solicitacao.projeto}`}
                </p>
              </div>
              <Link href={`/comercial/solicitacoes/${solicitacao.id}`} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                <ExternalLink size={14} /> Abrir
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Status</span>
                <span className="font-medium text-slate-700 dark:text-slate-300"><StatusBadge status={solicitacao.status} /></span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Tipo</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {solicitacao.tipo === "DESENVOLVIMENTO_TECELAGEM" ? "Tecelagem" : "Beneficiamento"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Solicitante</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{solicitacao.solicitanteNome || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Responsável</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{solicitacao.responsavelNome || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Criado em</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {solicitacao.createdAt ? new Date(solicitacao.createdAt).toLocaleString("pt-BR") : "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Prazo desejado</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {solicitacao.prazoDesejado ? new Date(solicitacao.prazoDesejado).toLocaleDateString("pt-BR") : "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Concluído em</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {solicitacao.dataConclusao ? new Date(solicitacao.dataConclusao).toLocaleDateString("pt-BR") : "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">CNPJ</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{solicitacao.cnpj || "—"}</span>
              </div>
            </div>
          </div>

          {/* Produtos */}
          {produtos.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <FileText size={16} className="inline mr-1.5" />
                  Produtos Vinculados ({produtos.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {produtos.map((prod: any) => (
                  <div key={prod.id} className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link href={`/cadastros/produto-cru/${prod.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                          {prod.codigoPdm}
                        </Link>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{prod.descricao}</p>
                      </div>
                      <StatusBadge status={prod.status} />
                    </div>

                    {prod.amostras && prod.amostras.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                          <FlaskConical size={12} className="inline mr-1" />
                          Amostras Tecido Cru ({prod.amostras.length})
                        </h4>
                        <div className="space-y-1">
                          {prod.amostras.map((a: any) => (
                            <div key={a.id} className="flex items-center gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{a.descricao || `Amostra #${a.id}`}</span>
                              <StatusBadge status={a.status} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {prod.acabamentos && prod.acabamentos.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                          <Activity size={12} className="inline mr-1" />
                          Acabamentos ({prod.acabamentos.length})
                        </h4>
                        <div className="space-y-2">
                          {prod.acabamentos.map((ac: any) => (
                            <div key={ac.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-xs mb-1.5">
                                <span className="font-medium text-slate-700 dark:text-slate-300">{ac.tipoAcabamento}</span>
                                {ac.descricao && <span className="text-slate-400">— {ac.descricao}</span>}
                              </div>
                              {ac.amostras && ac.amostras.length > 0 ? (
                                <div className="space-y-1 pl-2">
                                  {ac.amostras.map((aa: any) => (
                                    <div key={aa.id} className="flex items-center gap-3 text-xs">
                                      <span className="text-slate-500">{aa.descricao || `Amostra #${aa.id}`}</span>
                                      <StatusBadge status={aa.status} />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-400 italic pl-2">Sem amostras</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!prod.amostras || prod.amostras.length === 0) && (!prod.acabamentos || prod.acabamentos.length === 0) && (
                      <p className="text-xs text-slate-400 italic">Nenhuma amostra vinculada a este produto</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              <Clock size={16} className="inline mr-1.5" />
              Linha do Tempo
            </h3>
            {timeline.length > 0 ? (
              <div className="space-y-0 max-h-[600px] overflow-y-auto">
                {timeline.map((entry, idx) => (
                  <TimelineItem key={idx} entry={entry} isLast={idx === timeline.length - 1} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic text-center py-8">Nenhum evento registrado</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDENTE: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-400",
    APROVADO: "bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400",
    REPROVADO: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
    APROVADO_CLI: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    EM_DESENVOLVIMENTO: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    CONCLUIDO_DEV: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
    CONCLUIDO: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    EM_PRODUCAO_TEC: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400",
    EM_PRODUCAO_BEN: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
    APROVADO_DESENVOLVIMENTO: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
    APROVADO_COMERCIAL: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ml-1 ${colors[status] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
      {status}
    </span>
  )
}

function TimelineItem({ entry, isLast }: { entry: TimelineEntry; isLast: boolean }) {
  const date = new Date(entry.data)
  const iconMap: Record<string, JSX.Element> = {
    CRIACAO: <CheckCircle size={14} className="text-green-500" />,
    MUDANCA_STATUS: <AlertCircle size={14} className="text-blue-500" />,
    ALTERACAO: <FileText size={14} className="text-amber-500" />,
    ATUALIZACAO: <FileText size={14} className="text-slate-500" />,
  }
  const icon = iconMap[entry.acao || ""] || <Activity size={14} className="text-slate-400" />

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        {!isLast && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700" />}
      </div>
      <div className={`pb-4 ${isLast ? "" : ""}`}>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{entry.usuario}</span>
          <span className="text-[10px] text-slate-400">{date.toLocaleString("pt-BR")}</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{entry.descricao}</p>
        {entry.detalhes && entry.detalhes.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {entry.detalhes.map((d, i) => (
              <li key={i} className="text-xs text-slate-500 dark:text-slate-500">• {d}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
