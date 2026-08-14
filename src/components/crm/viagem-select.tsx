"use client"

import { useQuery } from "@tanstack/react-query"
import { Plane } from "lucide-react"

type Props = {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function ViagemSelect({ value, onChange, className }: Props) {
  const { data } = useQuery<any[]>({
    queryKey: ["crm-viagens-all"],
    queryFn: () => fetch("/api/crm/viagens?all=true").then((r: any) => r.json()),
  })

  const viagens = Array.isArray(data) ? data : []

  return (
    <div className="flex items-center gap-1">
      <div className="relative flex-1">
        <Plane size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className || ""}`}
        >
          <option value="">Nenhuma viagem</option>
          {viagens.map((v: any) => (
            <option key={v.id} value={String(v.id)}>
              {v.titulo}
              {v.destinoCidade ? ` — ${v.destinoCidade}${v.destinoUf ? ` (${v.destinoUf})` : ""}` : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
