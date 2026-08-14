"use client"

import { useQuery } from "@tanstack/react-query"

type Segmento = { id: number; nome: string; ativo: boolean }

type Props = {
  value: string
  onChange: (segmento: string) => void
  className?: string
}

export function SelectSegmento({ value, onChange, className }: Props) {
  const { data: segmentos = [] } = useQuery<Segmento[]>({
    queryKey: ["crm-segmentos"],
    queryFn: async () => {
      const res = await fetch("/api/crm/segmentos")
      if (!res.ok) return []
      return res.json()
    },
  })

  const nomes = (segmentos || []).filter((s) => s.ativo !== false).map((s) => s.nome)
  const temFallback = value && !nomes.includes(value)

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className || ""}`}
    >
      <option value="">Selecione...</option>
      {temFallback && <option value={value}>{value}</option>}
      {nomes.map((nome) => (
        <option key={nome} value={nome}>{nome}</option>
      ))}
    </select>
  )
}
