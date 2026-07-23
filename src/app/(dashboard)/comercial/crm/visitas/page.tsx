"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { PlusCircle, CalendarDays, Table, Columns, Search, MapPin, Navigation, Users, User, ChevronLeft, ChevronRight, CalendarRange, X } from "lucide-react"
import { useStatuses } from "@/hooks/use-statuses"
import VisitasCalendario from "@/components/crm/visitas-calendario"
import VisitasKanban from "@/components/crm/visitas-kanban"
import { FloatableKanban } from "@/components/crm/floatable-kanban"
import VisitLocationModal from "@/components/crm/visit-location-modal"

const PAGE_SIZE = 50

async function fetchVisitasPaginated(params: { mine: boolean; page: number; q: string; dataInicio: string; dataFim: string }) {
  const sp = new URLSearchParams()
  sp.set("page", String(params.page))
  sp.set("limit", String(PAGE_SIZE))
  if (params.mine) sp.set("mine", "true")
  if (params.q) sp.set("q", params.q)
  if (params.dataInicio) sp.set("dataInicio", params.dataInicio)
  if (params.dataFim) sp.set("dataFim", params.dataFim)
  const res = await fetch(`/api/crm/visitas?${sp}`)
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

async function fetchVisitasAll(mine: boolean) {
  const res = await fetch(`/api/crm/visitas?all=true${mine ? "&mine=true" : ""}`)
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

const TIPO_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  VIDEO: "Vídeo",
  TELEFONE: "Telefone",
}

const TIPO_CORES: Record<string, string> = {
  PRESENCIAL: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  VIDEO: "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400",
  TELEFONE: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
}

type ModoVisao = "tabela" | "calendario" | "kanban"

export default function VisitasPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const info = getInfoContent(pathname)
  const { getLabel, getColor } = useStatuses("VISITA")
  const { data: session } = useSession()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [modo, setModo] = useState<ModoVisao>(searchParams.get("view") === "kanban" ? "kanban" : "tabela")
  const [selectedVisita, setSelectedVisita] = useState<{ id: number; nome: string } | null>(null)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const userRole = (session?.user as any)?.role
  const isComercial = userRole && !["ADMIN", "SUDO", "CRM"].includes(userRole)
  const [visitasFilter, setVisitasFilter] = useState<"todas" | "minhas">("todas")
  const [filterReady, setFilterReady] = useState(false)

  useEffect(() => {
    if (session && !filterReady) {
      setVisitasFilter(isComercial ? "minhas" : "todas")
      setFilterReady(true)
    }
  }, [session, isComercial, filterReady])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 400)
  }, [])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const isTableMode = modo === "tabela"

  const { data: tableData, isLoading: tableLoading } = useQuery({
    queryKey: ["crm-visitas-table", visitasFilter, page, debouncedSearch, dataInicio, dataFim],
    queryFn: () => fetchVisitasPaginated({ mine: visitasFilter === "minhas", page, q: debouncedSearch, dataInicio, dataFim }),
    retry: 1,
    enabled: isTableMode,
  })

  const { data: allVisitas, isLoading: allLoading } = useQuery({
    queryKey: ["crm-visitas-all", visitasFilter],
    queryFn: () => fetchVisitasAll(visitasFilter === "minhas"),
    retry: 1,
    enabled: !isTableMode,
  })

  const isLoading = isTableMode ? tableLoading : allLoading
  const tableRows = tableData?.data || []
  const totalRows = tableData?.total || 0
  const totalPages = tableData?.totalPages || 0
  const visitas = isTableMode ? tableRows : (allVisitas || [])

  const fromRow = totalRows === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const toRow = Math.min(page * PAGE_SIZE, totalRows)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Visitas{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Carregando..." : isTableMode
              ? totalRows > 0 ? `${fromRow}-${toRow} de ${totalRows} visita(s)` : "0 visitas"
              : `${visitas.length} visita(s)`
            }
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 shadow-sm">
            <button
              onClick={() => setVisitasFilter("todas")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                visitasFilter === "todas"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Users size={14} />
              Todas
            </button>
            <button
              onClick={() => setVisitasFilter("minhas")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                visitasFilter === "minhas"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <User size={14} />
              Minhas Visitas
            </button>
          </div>
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 shadow-sm">
            <button
              onClick={() => setModo("tabela")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                modo === "tabela"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Table size={14} />
              Tabela
            </button>
            <button
              onClick={() => setModo("calendario")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                modo === "calendario"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <CalendarDays size={14} />
              Calendário
            </button>
            <button
              onClick={() => setModo("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                modo === "kanban"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Columns size={14} />
              Kanban
            </button>
          </div>
          <Link
            href="/comercial/crm/visitas/novo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle size={14} />
            Nova Visita
          </Link>
        </div>
      </div>

      {modo === "tabela" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por pessoa, cliente ou oportunidade..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <CalendarRange size={14} />
              <span>Período:</span>
            </div>
            <input
              type="date"
              value={dataInicio}
              onChange={e => { setDataInicio(e.target.value); setPage(1) }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-400">até</span>
            <input
              type="date"
              value={dataFim}
              onChange={e => { setDataFim(e.target.value); setPage(1) }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {(dataInicio || dataFim) && (
              <button
                onClick={() => { setDataInicio(""); setDataFim(""); setPage(1) }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                title="Limpar período"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {modo === "calendario" ? (
          isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <VisitasCalendario visitas={visitas || []} />
          )
        ) : modo === "kanban" ? (
          isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <FloatableKanban tipo="VISITA"><VisitasKanban visitas={visitas || []} /></FloatableKanban>
          )
        ) : isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : tableRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {debouncedSearch ? "Nenhuma visita encontrada para essa busca" : "Nenhuma visita encontrada"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Data</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Entidade</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden sm:table-cell">Oportunidade</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Tipo</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Status</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden md:table-cell">Criado por</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tableRows.map((v: any) => (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                      onClick={() => router.push(`/comercial/crm/visitas/${v.id}`)}
                    >
                      <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-slate-900 dark:text-slate-200 whitespace-nowrap">
                        {v.dataVisita ? new Date(v.dataVisita + "T12:00:00").toLocaleDateString("pt-BR") : "—"}{v.hora ? ` ${v.hora}` : ""}
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm font-medium text-slate-900 dark:text-slate-200">{v.empresaNome || v.clienteNome || "—"}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-slate-500 hidden sm:table-cell">{v.oportunidadeTitulo || "—"}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3">
                        <span className={`inline-flex text-[10px] px-1.5 md:px-2 py-0.5 rounded-full font-medium ${TIPO_CORES[v.tipo] || ""}`}>
                          {TIPO_LABELS[v.tipo] || v.tipo}
                        </span>
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3">
                        <span
                          className="inline-flex text-[10px] px-1.5 md:px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: getColor(v.status) + "20", color: getColor(v.status) }}
                        >
                          {getLabel(v.status)}
                        </span>
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-slate-500 hidden md:table-cell">{v.criadoPorNome || "—"}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3">
                        <div className="flex items-center gap-1">
                          {(v.endereco || v.cidade) && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([v.endereco, v.numero, v.complemento, v.bairro, v.cidade, v.uf].filter(Boolean).join(", "))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                              title="Abrir no Google Maps"
                            >
                              <Navigation size={16} className="text-emerald-500" />
                            </a>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedVisita({ id: v.id, nome: v.empresaNome || v.clienteNome || "Visita" })
                            }}
                            className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                            title="Gerenciar localizações"
                          >
                            <MapPin size={16} className="text-blue-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Página {page} de {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                          pageNum === page
                            ? "bg-blue-600 text-white"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedVisita && (
        <VisitLocationModal
          visitaId={selectedVisita.id}
          empresaNome={selectedVisita.nome}
          open={!!selectedVisita}
          onClose={() => setSelectedVisita(null)}
        />
      )}
    </div>
  )
}
