"use client"

import { useQuery } from "@tanstack/react-query"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { PlusCircle, Target, Search, Table, Columns } from "lucide-react"
import { toast } from "sonner"
import { FloatableKanban } from "@/components/crm/floatable-kanban"
import OportunidadesKanban from "@/components/crm/oportunidades-kanban"

async function fetchOportunidades() {
  const res = await fetch("/api/crm/oportunidades")
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

const STATUS_CORES: Record<string, string> = {
  NOVO: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  QUALIFICACAO: "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400",
  PROPOSTA: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/50 dark:text-yellow-400",
  NEGOCIACAO: "text-orange-600 bg-orange-50 dark:bg-orange-950/50 dark:text-orange-400",
  FECHADO_GANHO: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
  FECHADO_PERDIDO: "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400",
}

const STATUS_LABELS: Record<string, string> = {
  NOVO: "Novo",
  QUALIFICACAO: "Qualificação",
  PROPOSTA: "Proposta",
  NEGOCIACAO: "Negociação",
  FECHADO_GANHO: "Ganho",
  FECHADO_PERDIDO: "Perdido",
}

export default function OportunidadesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")
  const [modo, setModo] = useState<"tabela" | "kanban">("tabela")

  const { data: oportunidades, isLoading } = useQuery({
    queryKey: ["crm-oportunidades"],
    queryFn: fetchOportunidades,
    retry: 1,
  })

  const filtered = (oportunidades || []).filter((o: any) =>
    !search || o.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    o.empresaNome?.toLowerCase().includes(search.toLowerCase())
  )

  function formatarMoeda(valor: string | null | undefined) {
    if (!valor) return "-"
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Oportunidades{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Carregando..." : `${filtered.length} oportunidade(s)`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            href="/comercial/crm/oportunidades/novo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle size={14} />
            Nova Oportunidade
          </Link>
        </div>
      </div>

      {modo === "tabela" && (
      <>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por título ou pessoa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Target className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma oportunidade encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Título</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Pessoa</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden sm:table-cell">Valor Est.</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Status</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden md:table-cell">Responsável</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden sm:table-cell">Prob.</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden sm:table-cell">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((op: any) => (
                  <tr
                    key={op.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => router.push(`/comercial/crm/oportunidades/${op.id}`)}
                  >
                    <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">{op.titulo}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-slate-500">{op.empresaNome || "—"}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-slate-500 hidden sm:table-cell whitespace-nowrap">{formatarMoeda(op.valorEstimado)}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3">
                      <span className={`inline-flex text-[10px] px-1.5 md:px-2 py-0.5 rounded-full font-medium ${STATUS_CORES[op.status] || ""}`}>
                        {STATUS_LABELS[op.status] || op.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-slate-500 hidden md:table-cell">{op.responsavelNome || "—"}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-slate-500 hidden sm:table-cell">{op.probabilidade ?? 0}%</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-slate-500 whitespace-nowrap hidden sm:table-cell">
                      {op.createdAt ? new Date(op.createdAt).toLocaleDateString("pt-BR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {modo === "kanban" && (
        isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <FloatableKanban tipo="OPORTUNIDADE"><OportunidadesKanban oportunidades={oportunidades || []} /></FloatableKanban>
        )
      )}
    </div>
  )
}
