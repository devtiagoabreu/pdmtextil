"use client"

import { useQuery } from "@tanstack/react-query"

export interface ProcAreaOption {
  id: number
  siteId: number
  siteNome: string | null
  nome: string
  descricao?: string | null
  ativo: boolean
}

interface AreaSelectProps {
  /** Valor selecionado: "" = todas, ou o id da área como string */
  value: string
  onChange: (value: string) => void
  /** Inclui opção "Todas as áreas" (default true) */
  includeAll?: boolean
  id?: string
  label?: string
  className?: string
}

export function useProcAreas() {
  return useQuery<ProcAreaOption[]>({
    queryKey: ["proc-areas"],
    queryFn: async () => {
      const res = await fetch("/api/processos/areas")
      if (!res.ok) throw new Error("Falha ao carregar áreas")
      return res.json()
    },
  })
}

export default function AreaSelect({
  value,
  onChange,
  includeAll = true,
  id,
  label,
  className,
}: AreaSelectProps) {
  const { data: areas = [] } = useProcAreas()

  const grupos = new Map<string, ProcAreaOption[]>()
  for (const area of areas) {
    const site = area.siteNome || "Outros"
    if (!grupos.has(site)) grupos.set(site, [])
    grupos.get(site)!.push(area)
  }

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium" htmlFor={id}>
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label || "Filtrar por área"}
        className={
          className ||
          "w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
        }
      >
        {includeAll && <option value="">Todas as áreas</option>}
        {[...grupos.entries()].map(([site, siteAreas]) => (
          <optgroup key={site} label={site}>
            {siteAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nome}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}