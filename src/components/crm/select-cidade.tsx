"use client"

import { useState, useEffect, useCallback } from "react"
import { QuickCreateCidade } from "./quick-create-cidade"

type Cidade = { id: number; nome: string; estadoId: number }

type Props = {
  value: string
  onChange: (cidade: string) => void
  estadoId: number | null
  className?: string
}

export function SelectCidade({ value, onChange, estadoId, className }: Props) {
  const [cidades, setCidades] = useState<Cidade[]>([])

  const fetchCidades = useCallback(async () => {
    if (!estadoId) {
      setCidades([])
      return
    }
    try {
      const res = await fetch(`/api/crm/cidades?estadoId=${estadoId}`)
      if (res.ok) {
        const data = await res.json()
        setCidades(data)
      }
    } catch {}
  }, [estadoId])

  useEffect(() => { fetchCidades() }, [fetchCidades])

  function handleCidadeCreated(_id: number, nome: string) {
    onChange(nome)
    fetchCidades()
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={!estadoId}
        className={`flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${className || ""}`}
      >
        <option value="">{estadoId ? "Selecione a cidade..." : "Selecione o UF primeiro"}</option>
        {cidades.map(cid => (
          <option key={cid.id} value={cid.nome}>{cid.nome}</option>
        ))}
      </select>
      {estadoId && <QuickCreateCidade estadoId={estadoId} onCreated={handleCidadeCreated} />}
    </div>
  )
}
