"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { PlusCircle, UserPlus, Search, Phone, Star, Building2, XCircle, Table, Columns } from "lucide-react"
import { toast } from "sonner"
import { FloatableKanban } from "@/components/crm/floatable-kanban"
import LeadsKanban from "@/components/crm/leads-kanban"
import { ConfirmModal } from "@/components/ui/confirm-modal"

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
  const searchParams = useSearchParams()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")
  const [modo, setModo] = useState<"tabela" | "kanban">(searchParams.get("view") === "kanban" ? "kanban" : "tabela")
  const [leadToPerder, setLeadToPerder] = useState<any>(null)

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
    const isPF = lead.tipoPessoa === "PF"
    const label = isPF ? "Nome completo" : "Razão social"
    const valor = prompt(`${label}:`, lead.empresaNome || lead.nome)
    if (!valor) return

    try {
      const body: Record<string, unknown> = isPF
        ? { tipoPessoa: "PF", nome: valor }
        : { tipoPessoa: "PJ", razaoSocial: valor }

      const res = await fetch("/api/crm/pessoas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Erro ao criar pessoa")
      const pessoa = await res.json()

      await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONVERTIDO", pessoaId: pessoa.id }),
      })

      toast.success(`Lead convertido para pessoa "${valor}"`)
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

  function formatDateTime(dateStr: string) {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    })
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
            href="/comercial/crm/leads/novo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle size={14} />
            Novo Lead
          </Link>
        </div>
      </div>

      {modo === "tabela" && (
      <>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nome, email ou pessoa..."
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
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Nome</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden sm:table-cell">Contato</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden md:table-cell">Pessoa</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden sm:table-cell">Score</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden lg:table-cell">Origem</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden lg:table-cell">Responsável</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Status</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden sm:table-cell">Criado</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap">
                      <Link href={`/comercial/crm/leads/${lead.id}`} className="text-slate-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400">
                        {lead.nome}
                      </Link>
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-slate-500 hidden sm:table-cell">
                      {lead.email && <div className="truncate max-w-[180px]">{lead.email}</div>}
                      {lead.celular && <div className="text-xs">{lead.celular}</div>}
                      {!lead.email && !lead.celular && "—"}
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-slate-500 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {lead.empresaNome || (lead.empresaRazaoSocial ? (
                          <Link href={`/comercial/crm/pessoas/${lead.empresaId}`} className="text-blue-600 hover:underline">
                            {lead.empresaRazaoSocial}
                          </Link>
                        ) : "—")}
                        {lead.tipoPessoa && (
                          <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            lead.tipoPessoa === "PF"
                              ? "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400"
                              : "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 dark:text-cyan-400"
                          }`}>
                            {lead.tipoPessoa === "PF" ? "PF" : "PJ"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 hidden sm:table-cell">
                      {lead.score != null ? (
                        <span className={`inline-flex text-[10px] px-1.5 md:px-2 py-0.5 rounded-full font-medium ${
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
                    <td className="px-2 py-2 md:px-4 md:py-3 hidden lg:table-cell">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                        {ORIGEM_LABELS[lead.origem] || lead.origem}
                      </span>
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-slate-500 hidden lg:table-cell">{lead.responsavelNome || "—"}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3">
                      <span className={`inline-flex text-[10px] px-1.5 md:px-2 py-0.5 rounded-full font-medium ${STATUS_CORES[lead.status] || ""}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-slate-500 whitespace-nowrap hidden sm:table-cell">{formatDateTime(lead.createdAt)}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3">
                      <div className="flex items-center gap-2">
                        {lead.status === "NOVO" && (
                          <button
                            onClick={() => mudarStatus(lead, "CONTATADO")}
                            title="Contatar"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          >
                            <Phone size={15} />
                          </button>
                        )}
                        {lead.status === "CONTATADO" && (
                          <button
                            onClick={() => mudarStatus(lead, "QUALIFICADO")}
                            title="Qualificar"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          >
                            <Star size={15} />
                          </button>
                        )}
                        {(lead.status === "QUALIFICADO" || lead.status === "NOVO") && !lead.empresaId && (
                          <button
                            onClick={() => converterParaEmpresa(lead)}
                            title="Converter para Pessoa (Negócio)"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                          >
                            <Building2 size={15} />
                          </button>
                        )}
                        {lead.status !== "PERDIDO" && lead.status !== "CONVERTIDO" && (
                          <button
                            onClick={() => setLeadToPerder(lead)}
                            title="Perder"
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <XCircle size={15} />
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
      </>
      )}

      {modo === "kanban" && (
        isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <FloatableKanban tipo="LEAD"><LeadsKanban leads={filtered} /></FloatableKanban>
        )
      )}

      <ConfirmModal
        open={!!leadToPerder}
        title="Marcar lead como perdido?"
        message={`O lead "${leadToPerder?.nome}" será marcado como PERDIDO.`}
        subMessage="Esta ação não pode ser desfeita facilmente."
        variant="danger"
        confirmLabel="Marcar como Perdido"
        onConfirm={() => { if (leadToPerder) { mudarStatus(leadToPerder, "PERDIDO"); setLeadToPerder(null) } }}
        onCancel={() => setLeadToPerder(null)}
      />
    </div>
  )
}
