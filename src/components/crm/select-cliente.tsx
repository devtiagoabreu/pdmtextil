"use client"

import { useQuery } from "@tanstack/react-query"

type Cliente = { id: number; nome: string }

type Props = {
  value: string
  onChange: (clienteId: string) => void
  className?: string
}

export function SelectCliente({ value, onChange, className }: Props) {
  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ["clientes"],
    queryFn: async () => {
      const res = await fetch("/api/clientes")
      if (!res.ok) return []
      return res.json()
    },
  })

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className || ""}`}
    >
      <option value="">Selecione...</option>
      {(clientes || []).map((c) => (
        <option key={c.id} value={c.id}>{c.nome}</option>
      ))}
    </select>
  )
}
