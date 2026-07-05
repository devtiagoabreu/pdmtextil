"use client"

import { useState, useEffect, useCallback } from "react"
import { QuickCreateEstado } from "./quick-create-estado"

type Estado = { id: number; nome: string; uf: string }

type Props = {
  value: string
  onChange: (uf: string) => void
  className?: string
}

export function SelectUf({ value, onChange, className }: Props) {
  const [estados, setEstados] = useState<Estado[]>([])

  const fetchEstados = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/estados")
      if (res.ok) {
        const data = await res.json()
        setEstados(data)
      }
    } catch {}
  }, [])

  useEffect(() => { fetchEstados() }, [fetchEstados])

  function handleEstadoCreated(_id: number, uf: string) {
    onChange(uf)
    fetchEstados()
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className || ""}`}
      >
        <option value="">UF...</option>
        {estados.map(est => (
          <option key={est.id} value={est.uf}>{est.uf} - {est.nome}</option>
        ))}
      </select>
      <QuickCreateEstado onCreated={handleEstadoCreated} />
    </div>
  )
}
