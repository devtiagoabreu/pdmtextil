"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { PlusCircle, FileText, Search, Table, Columns, Users, User } from "lucide-react"
import PropostasKanban from "@/components/crm/propostas-kanban"
import { FloatableKanban } from "@/components/crm/floatable-kanban"

async function fetchPropostas(mine: boolean) {
  const res = await fetch(`/api/crm/propostas${mine ? "?mine=true" : ""}`)
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

const STATUS_LABELS: Record<string, string> = {
  ENVIADA: "Enviada",
  ACEITA: "Aceita",
  RECUSADA: "Recusada",
  REVISAO: "Em Revisão",
}

const STATUS_CORES: Record<string, string> = {
  ENVIADA: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  ACEITA: "text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400",
  RECUSADA: "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400",
  REVISAO: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
}

export default function PropostasPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const info = getInfoContent(pathname)
  const { data: session } = useSession()
  const [search, setSearch] = useState("")
  const [modo, setModo] = useState<"tabela" | "kanban">(searchParams.get("view") === "kanban" ? "kanban" : "tabela")

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

  const { data: propostas, isLoading } = useQuery({
    queryKey: ["crm-propostas", visitasFilter],
    queryFn: () => fetchPropostas(visitasFilter === "minhas"),
    retry: 1,
  })

  const filtered = (propostas || []).filter((p: any) =>
    !search || p.empresaNome?.toLowerCase().includes(search.toLowerCase()) ||
    p.titulo?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Propostas{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Carregando..." : `${filtered.length} proposta(s)`}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
              Minhas
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
            href="/comercial/crm/propostas/novo"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            Nova Proposta
          </Link>
        </div>
      </div>

      {modo === "tabela" && (
      <>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por pessoa ou título..."
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
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma proposta encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Título</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Pessoa (Negócio)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((p: any) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => router.push(`/comercial/crm/propostas/${p.id}`)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-200">{p.titulo}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{p.empresaNome || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-200">
                      {p.valor ? `R$ ${Number(p.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_CORES[p.status] || ""}`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString("pt-BR") : "—"}
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
          <FloatableKanban tipo="PROPOSTA"><PropostasKanban propostas={filtered} /></FloatableKanban>
        )
      )}
    </div>
  )
}
