"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { QuickCreateProposta } from "@/components/crm/quick-create-proposta"

function formatValor(v: any) {
  if (!v) return null
  const n = Number(v)
  if (isNaN(n)) return null
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function PropostasCard({ empresaId }: { empresaId: string }) {
  const queryClient = useQueryClient()
  const { data } = useQuery<any[]>({
    queryKey: ["crm-pessoa-propostas", empresaId],
    queryFn: async () => {
      const res = await fetch(`/api/crm/propostas?empresaId=${empresaId}`)
      if (!res.ok) return []
      return res.json()
    },
  })
  const propostas = data ?? []

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Propostas</h2>
        <QuickCreateProposta
          empresaId={empresaId}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ["crm-pessoa-propostas", empresaId] })}
        />
      </div>
      {propostas.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">Nenhuma proposta vinculada</p>
      ) : (
        <div className="space-y-2">
          {propostas.map((prop: any) => (
            <Link
              key={prop.id}
              href={`/comercial/crm/propostas/${prop.id}`}
              className="block p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{prop.titulo}</p>
                {prop.status && <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{prop.status}</span>}
              </div>
              {formatValor(prop.valor) && (
                <p className="text-xs text-slate-500 mt-0.5">{formatValor(prop.valor)}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
