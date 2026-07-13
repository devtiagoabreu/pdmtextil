"use client"

import { useQuery } from "@tanstack/react-query"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { PlusCircle, CalendarDays, Table, Columns, Search } from "lucide-react"
import { useStatuses } from "@/hooks/use-statuses"
import VisitasCalendario from "@/components/crm/visitas-calendario"
import VisitasKanban from "@/components/crm/visitas-kanban"

async function fetchVisitas() {
  const res = await fetch("/api/crm/visitas")
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
  const info = getInfoContent(pathname)
  const { getLabel, getColor } = useStatuses("VISITA")
  const [search, setSearch] = useState("")
  const [modo, setModo] = useState<ModoVisao>("tabela")

  const { data: visitas, isLoading } = useQuery({
    queryKey: ["crm-visitas"],
    queryFn: fetchVisitas,
    retry: 1,
  })

  const filtered = (visitas || []).filter((v: any) =>
    !search || v.empresaNome?.toLowerCase().includes(search.toLowerCase()) ||
    v.oportunidadeTitulo?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Visitas{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Carregando..." : `${filtered.length} visita(s)`}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            Nova Visita
          </Link>
        </div>
      </div>

      {modo === "tabela" && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por pessoa ou oportunidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            <VisitasKanban visitas={visitas || []} />
          )
        ) : isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma visita encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Pessoa (Negócio)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Oportunidade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Criado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((v: any) => (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => router.push(`/comercial/crm/visitas/${v.id}`)}
                  >
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-200">
                      {v.dataVisita ? new Date(v.dataVisita + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-200">{v.empresaNome || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{v.oportunidadeTitulo || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${TIPO_CORES[v.tipo] || ""}`}>
                        {TIPO_LABELS[v.tipo] || v.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: getColor(v.status) + "20", color: getColor(v.status) }}
                      >
                        {getLabel(v.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{v.criadoPorNome || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
