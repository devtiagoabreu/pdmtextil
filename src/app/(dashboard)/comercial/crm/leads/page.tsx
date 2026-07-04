"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { PlusCircle, UserPlus, Search } from "lucide-react"
import { toast } from "sonner"

async function fetchLeads() {
  const res = await fetch("/api/crm/leads")
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

const STATUS_CORES: Record<string, string> = {
  NOVO: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  CONTATADO: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
  QUALIFICADO: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
  CONVERTIDO: "text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400",
  PERDIDO: "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400",
}

const ORIGEM_LABELS: Record<string, string> = {
  SITE: "Site",
  INDICACAO: "Indicação",
  EVENTO: "Evento",
  PROSPECCAO: "Prospecção",
  LIGACAO: "Ligação",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  OUTRO: "Outro",
}

export default function CrmLeadsPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")

  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ["crm-leads"],
    queryFn: fetchLeads,
    retry: 1,
  })

  const filtered = (leads || []).filter((l: any) =>
    !search || l.nome?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.empresaNome?.toLowerCase().includes(search.toLowerCase())
  )

  async function converterParaEmpresa(lead: any) {
    const nomeEmpresa = prompt("Nome da empresa (razão social):", lead.empresaNome || lead.nome)
    if (!nomeEmpresa) return

    try {
      const res = await fetch("/api/crm/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razaoSocial: nomeEmpresa }),
      })
      if (!res.ok) throw new Error("Erro ao criar empresa")
      const empresa = await res.json()

      await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONVERTIDO", empresaId: empresa.id }),
      })

      toast.success(`Lead convertido para empresa "${nomeEmpresa}"`)
      refetch()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function mudarStatus(lead: any, status: string) {
    try {
      await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      toast.success(`Lead alterado para ${status}`)
      refetch()
    } catch {
      toast.error("Erro ao atualizar status")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Leads{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Carregando..." : `${filtered.length} lead(s)`}
          </p>
        </div>
        <Link
          href="/comercial/crm/leads/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle size={16} />
          Novo Lead
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nome, email ou empresa..."
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
            <UserPlus className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhum lead encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Contato</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Empresa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Score IA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Origem</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Responsável</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-200">{lead.nome}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {lead.email && <div className="truncate max-w-[180px]">{lead.email}</div>}
                      {lead.telefone && <div className="text-xs">{lead.telefone}</div>}
                      {!lead.email && !lead.telefone && "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {lead.empresaNome || (lead.empresaRazaoSocial ? (
                        <Link href={`/comercial/crm/empresas/${lead.empresaId}`} className="text-blue-600 hover:underline">
                          {lead.empresaRazaoSocial}
                        </Link>
                      ) : "—")}
                    </td>
                    <td className="px-4 py-3">
                      {lead.score != null ? (
                        <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          lead.score >= 70
                            ? "text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400"
                            : lead.score >= 40
                            ? "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400"
                            : "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400"
                        }`}>
                          {lead.score}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                        {ORIGEM_LABELS[lead.origem] || lead.origem}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{lead.responsavelNome || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_CORES[lead.status] || ""}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {lead.status === "NOVO" && (
                          <button onClick={() => mudarStatus(lead, "CONTATADO")} className="text-[10px] text-amber-600 hover:underline font-medium">
                            Contatar
                          </button>
                        )}
                        {lead.status === "CONTATADO" && (
                          <button onClick={() => mudarStatus(lead, "QUALIFICADO")} className="text-[10px] text-emerald-600 hover:underline font-medium">
                            Qualificar
                          </button>
                        )}
                        {(lead.status === "QUALIFICADO" || lead.status === "NOVO") && !lead.empresaId && (
                          <button onClick={() => converterParaEmpresa(lead)} className="text-[10px] text-blue-600 hover:underline font-medium">
                            Converter
                          </button>
                        )}
                        {lead.status !== "PERDIDO" && lead.status !== "CONVERTIDO" && (
                          <button onClick={() => mudarStatus(lead, "PERDIDO")} className="text-[10px] text-red-600 hover:underline font-medium">
                            Perder
                          </button>
                        )}
                      </div>
                    </td>
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
