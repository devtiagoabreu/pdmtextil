"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { QuickCreateOportunidade } from "@/components/crm/quick-create-oportunidade"

function formatValor(v: any) {
  if (!v) return null
  const n = Number(v)
  if (isNaN(n)) return null
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function OportunidadesCard({ empresaId }: { empresaId: string }) {
  const queryClient = useQueryClient()
  const { data } = useQuery<any[]>({
    queryKey: ["crm-pessoa-oportunidades", empresaId],
    queryFn: async () => {
      const res = await fetch(`/api/crm/oportunidades?empresaId=${empresaId}`)
      if (!res.ok) return []
      return res.json()
    },
  })
  const oportunidades = data ?? []

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Oportunidades</h2>
        <QuickCreateOportunidade
          empresaId={empresaId}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ["crm-pessoa-oportunidades", empresaId] })}
        />
      </div>
      {oportunidades.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">Nenhuma oportunidade vinculada</p>
      ) : (
        <div className="space-y-2">
          {oportunidades.map((op: any) => (
            <Link
              key={op.id}
              href={`/comercial/crm/oportunidades/${op.id}`}
              className="block p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{op.titulo}</p>
                {op.status && <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{op.status}</span>}
              </div>
              {formatValor(op.valorEstimado) && (
                <p className="text-xs text-slate-500 mt-0.5">{formatValor(op.valorEstimado)}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
