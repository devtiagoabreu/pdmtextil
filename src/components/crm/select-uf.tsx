"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QuickCreateEstado } from "./quick-create-estado"

type Estado = { id: number; nome: string; uf: string }

type Props = {
  value: string
  onChange: (uf: string) => void
  className?: string
}

export function SelectUf({ value, onChange, className }: Props) {
  const queryClient = useQueryClient()

  const { data: estados = [] } = useQuery<Estado[]>({
    queryKey: ["crm-estados"],
    queryFn: () => fetch("/api/crm/estados").then((r: any) => r.json()),
  })

  function handleEstadoCreated(_id: number, uf: string) {
    onChange(uf)
    queryClient.invalidateQueries({ queryKey: ["crm-estados"] })
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className || ""}`}
      >
        <option value="">UF...</option>
        {estados.map((est: any) => (
          <option key={est.id} value={est.uf}>{est.uf} - {est.nome}</option>
        ))}
      </select>
      <QuickCreateEstado onCreated={handleEstadoCreated} />
    </div>
  )
}
