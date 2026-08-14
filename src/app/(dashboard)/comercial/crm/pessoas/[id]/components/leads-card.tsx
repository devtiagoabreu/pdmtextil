"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { QuickCreateLead } from "@/components/crm/quick-create-lead"

export function LeadsCard({ empresaId }: { empresaId: string }) {
  const queryClient = useQueryClient()
  const { data } = useQuery<any[]>({
    queryKey: ["crm-pessoa-leads", empresaId],
    queryFn: async () => {
      const res = await fetch(`/api/crm/leads?empresaId=${empresaId}`)
      if (!res.ok) return []
      return res.json()
    },
  })
  const leads = data ?? []

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Leads</h2>
        <QuickCreateLead
          empresaId={empresaId}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ["crm-pessoa-leads", empresaId] })}
        />
      </div>
      {leads.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">Nenhum lead vinculado</p>
      ) : (
        <div className="space-y-2">
          {leads.map((lead: any) => (
            <Link
              key={lead.id}
              href={`/comercial/crm/leads/${lead.id}`}
              className="block p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{lead.nome}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {lead.empresaNomeFantasia || lead.empresaRazaoSocial || lead.empresaNome || [lead.cargo, lead.celular].filter(Boolean).join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
