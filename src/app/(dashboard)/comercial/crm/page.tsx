"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Building2, Users, Target, UserPlus, ArrowRight, TrendingUp } from "lucide-react"

async function fetchStats() {
  const [empresas, leads] = await Promise.all([
    fetch("/api/crm/empresas").then(r => r.json()),
    fetch("/api/crm/leads").then(r => r.json()),
  ])
  return { empresas: Array.isArray(empresas) ? empresas : [], leads: Array.isArray(leads) ? leads : [] }
}

const STATUS_CORES: Record<string, string> = {
  NOVO: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  QUALIFICADO: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
  CONVERTIDO: "text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400",
  PERDIDO: "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400",
  CONTATADO: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
}

export default function CrmDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["crm-stats"],
    queryFn: fetchStats,
    retry: 1,
  })

  const empresasPorStatus = (data?.empresas || []).reduce((acc: Record<string, number>, e: any) => {
    acc[e.status] = (acc[e.status] || 0) + 1
    return acc
  }, {})

  const leadsPorStatus = (data?.leads || []).reduce((acc: Record<string, number>, l: any) => {
    acc[l.status] = (acc[l.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">CRM</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gestão de relacionamento com clientes
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/comercial/crm/empresas" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-950/50 p-2.5">
                  <Building2 size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{(data?.empresas || []).length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Empresas</p>
                </div>
              </div>
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {Object.entries(empresasPorStatus).map(([status, count]) => (
                  <span key={status} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_CORES[status] || "text-slate-600 bg-slate-100"}`}>
                    {status}: {count}
                  </span>
                ))}
              </div>
            </Link>

            <Link href="/comercial/crm/leads" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 dark:bg-emerald-950/50 p-2.5">
                  <UserPlus size={20} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{(data?.leads || []).length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Leads</p>
                </div>
              </div>
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {Object.entries(leadsPorStatus).map(([status, count]) => (
                  <span key={status} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_CORES[status] || "text-slate-600 bg-slate-100"}`}>
                    {status}: {count}
                  </span>
                ))}
              </div>
            </Link>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 dark:bg-purple-950/50 p-2.5">
                  <Target size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">0</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Oportunidades</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">Em breve — Fase 2</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 dark:bg-amber-950/50 p-2.5">
                  <TrendingUp size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">0</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Propostas</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">Em breve</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <UserPlus size={16} className="text-emerald-500" />
                  Últimos Leads
                </h2>
                <Link href="/comercial/crm/leads" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  Ver todos <ArrowRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.leads || []).slice(0, 5).map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{lead.nome}</p>
                      <p className="text-xs text-slate-500">{lead.empresaNome || lead.email || "—"}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_CORES[lead.status] || ""}`}>
                      {lead.status}
                    </span>
                  </div>
                ))}
                {(!data?.leads || data.leads.length === 0) && (
                  <p className="text-sm text-slate-400 text-center py-8">Nenhum lead cadastrado</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-500" />
                  Últimas Empresas
                </h2>
                <Link href="/comercial/crm/empresas" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  Ver todas <ArrowRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.empresas || []).slice(0, 5).map((emp: any) => (
                  <div key={emp.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{emp.razaoSocial || emp.nomeFantasia}</p>
                      <p className="text-xs text-slate-500">{emp.cnpj || "—"}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_CORES[emp.status] || ""}`}>
                      {emp.status}
                    </span>
                  </div>
                ))}
                {(!data?.empresas || data.empresas.length === 0) && (
                  <p className="text-sm text-slate-400 text-center py-8">Nenhuma empresa cadastrada</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
