"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { BarChart3, Search, Clock, FileText, FlaskConical, CheckCircle, AlertCircle, ExternalLink, Activity, Beaker } from "lucide-react"
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

export default function HistoricoAmostraPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get("id")
  const selectedTipo = searchParams.get("tipo")

  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [amostrasList, setAmostrasList] = useState<any[]>([])
  const [searchText, setSearchText] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [orientacao, setOrientacao] = useState<"portrait" | "landscape">("portrait")
  const searchRef = useRef<HTMLDivElement>(null)

  const fetchHistory = useCallback(async (id: number, tipo: string) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/relatorios/historico-amostra?id=${id}&tipo=${tipo}`)
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Erro ao carregar histórico")
        setData(null)
        return
      }
      setData(await res.json())
    } catch {
      setError("Erro ao carregar histórico")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedId && selectedTipo) fetchHistory(parseInt(selectedId), selectedTipo)
  }, [selectedId, selectedTipo, fetchHistory])

  useEffect(() => {
    fetch("/api/amostras").then(r => r.json()).then((res) => {
      const combined = [
        ...(res.tecidoCru || []).map((a: any) => ({ ...a, tipoAmostra: "tecido_cru" })),
        ...(res.acabamento || []).map((a: any) => ({ ...a, tipoAmostra: "acabamento" })),
      ]
      setAmostrasList(combined)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filteredAmostras = useMemo(() => {
    if (!searchText) return amostrasList.slice(0, 50)
    const q = searchText.toLowerCase()
    return amostrasList.filter((a: any) =>
      a.id.toString().includes(q) ||
      (a.descricao && a.descricao.toLowerCase().includes(q)) ||
      (a.produtoCodigo && a.produtoCodigo.toLowerCase().includes(q))
    ).slice(0, 50)
  }, [amostrasList, searchText])

  function selectAmostra(id: number, tipo: string) {
    setShowDropdown(false)
    setSearchText("")
    router.push(`${pathname}?id=${id}&tipo=${tipo}`)
  }

  const timeline = useMemo(() => {
    const entries: TimelineEntry[] = []
    const amostra = data?.amostra
    if (amostra?.historico && Array.isArray(amostra.historico)) {
      for (const h of amostra.historico) {
        let desc = ""
        if (h.acao === "CRIACAO") desc = h.status ? `Amostra criada (status: ${h.status})` : "Amostra criada"
        else if (h.acao === "MUDANCA_STATUS") desc = `Status: ${h.de || "?"} → ${h.para || "?"}${h.motivo ? ` — ${h.motivo}` : ""}`
        else desc = h.acao
        entries.push({
          data: h.data,
          tipo: "historico",
          usuario: h.usuario || "Sistema",
          descricao: desc,
          acao: h.acao,
          detalhes: h.motivo ? [h.motivo] : undefined,
        })
      }
    }
    for (const l of data?.logs || []) {
      entries.push({
        data: l.createdAt,
        tipo: "log",
        usuario: l.usuarioNome || "Sistema",
        descricao: l.descricao || `${l.acao} (${l.tipo})`,
        acao: l.acao,
        detalhes: l.dados ? [JSON.stringify(l.dados)] : undefined,
      })
    }
    entries.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    return entries
  }, [data])

  async function handleExportPDF() {
    if (!data) return
    const a = data.amostra
    const tipoLabel = data.tipo === "tecido_cru" ? "Tecido Cru" : "Acabamento"
    const statusLabel = a.status || "—"

    const timelineRows: (string | number | null | undefined)[][] = timeline.map((e) => [
      new Date(e.data).toLocaleString("pt-BR"),
      e.usuario,
      e.descricao,
    ])

    const tables: { headers: string[]; rows: (string | number | null | undefined)[][] }[] = []

    tables.push({
      headers: ["#", "Descrição", "Tipo", "Status", "Produto"],
      rows: [[a.id, a.descricao || "—", tipoLabel, statusLabel, data.produto?.codigoPdm || "—"]]
    })

    if (data.solicitacao) {
      tables.push({
        headers: ["Solicitação", "Cliente", "Projeto", "Status Sol."],
        rows: [[
          `#${data.solicitacao.id}`,
          data.solicitacao.cliente,
          data.solicitacao.projeto || "—",
          data.solicitacao.status,
        ]]
      })
    }

    if (timelineRows.length > 0) {
      tables.push({ headers: ["Data", "Usuário", "Evento"], rows: timelineRows })
    }

    await exportPDFRelatorio({
      title: `Histórico — Amostra #${a.id} (${tipoLabel})`,
      stats: {
        "Descrição": a.descricao || "—",
        "Status": statusLabel,
        "Tipo": tipoLabel,
        "Produto": data.produto?.codigoPdm || "—",
        "Eventos": timeline.length,
      },
      tables,
      filename: `historico-amostra-${a.id}`,
      orientation: orientacao,
      statsLayout: "list",
    })
  }

  const info = getInfoContent(pathname)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Histórico de Amostra{info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Acompanhe todo o histórico de uma amostra: dados, produto, solicitação e timeline
        </p>
      </div>

      <div ref={searchRef} className="relative">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[260px] relative">
            <label className="block text-xs text-slate-400 mb-1">Buscar amostra</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Digite ID, descrição ou código do produto..."
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            {showDropdown && filteredAmostras.length > 0 && (
              <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                {filteredAmostras.map((a: any) => (
                  <button
                    key={`${a.tipoAmostra}-${a.id}`}
                    onClick={() => selectAmostra(a.id, a.tipoAmostra)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">#{a.id}</span>{" "}
                    <span className="text-slate-600 dark:text-slate-400">{a.descricao || "Sem descrição"}</span>
                    <span className="text-slate-400 ml-2 text-[10px]">
                      [{a.tipoAmostra === "tecido_cru" ? "CRU" : "ACAB"}]
                    </span>
                    {a.produtoCodigo && <span className="text-slate-400 ml-2">({a.produtoCodigo})</span>}
                    <StatusBadge status={a.status} />
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
                    if (!isNaN(val)) selectAmostra(val, "tecido_cru")
                  }
                }}
              />
              <select
                className="h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
                defaultValue="tecido_cru"
                id="tipo-select"
              >
                <option value="tecido_cru">Cru</option>
                <option value="acabamento">Acab.</option>
              </select>
              <button
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('input[type="number"]')
                  const tipoSel = document.querySelector<HTMLSelectElement>("#tipo-select")
                  if (input && tipoSel) {
                    const val = parseInt(input.value)
                    if (!isNaN(val)) selectAmostra(val, tipoSel.value)
                  }
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
          <Beaker className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4" />
          <p className="text-base font-medium text-slate-400 dark:text-slate-500">Selecione uma amostra para ver o histórico completo</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Header */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Amostra #{data.amostra.id}
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    ({data.tipo === "tecido_cru" ? "Tecido Cru" : "Acabamento"})
                  </span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">{data.amostra.descricao || "Sem descrição"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Status</span>
                <span className="font-medium text-slate-700 dark:text-slate-300"><StatusBadge status={data.amostra.status} /></span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Produto</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {data.produto ? (
                    <Link href={`/cadastros/produto-cru/${data.produto.id}`} className="text-blue-600 hover:text-blue-700">
                      {data.produto.codigoPdm}
                    </Link>
                  ) : "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Tipo</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {data.tipo === "tecido_cru" ? "Tecido Cru" : "Acabamento"}
                </span>
              </div>
              {data.acabamento && (
                <div>
                  <span className="text-xs text-slate-400 block">Acabamento</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {data.acabamento.tipoAcabamento}{data.acabamento.descricao ? ` — ${data.acabamento.descricao}` : ""}
                  </span>
                </div>
              )}
              {data.solicitacao && (
                <>
                  <div>
                    <span className="text-xs text-slate-400 block">Solicitação</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      <Link href={`/comercial/solicitacoes/${data.solicitacao.id}`} className="text-blue-600 hover:text-blue-700">
                        #{data.solicitacao.id}
                      </Link>
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Cliente</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{data.solicitacao.cliente}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Projeto</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{data.solicitacao.projeto || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Status Solic.</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300"><StatusBadge status={data.solicitacao.status} /></span>
                  </div>
                </>
              )}
            </div>
          </div>

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
      <div className="pb-4">
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
