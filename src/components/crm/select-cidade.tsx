"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QuickCreateCidade } from "./quick-create-cidade"

type Cidade = { id: number; nome: string; estadoId: number }

type Props = {
  value: string
  onChange: (cidade: string) => void
  estadoId: number | null
  className?: string
}

export function SelectCidade({ value, onChange, estadoId, className }: Props) {
  const queryClient = useQueryClient()

  const { data: cidades = [] } = useQuery<Cidade[]>({
    queryKey: ["crm-cidades", estadoId],
    queryFn: () => fetch(`/api/crm/cidades?estadoId=${estadoId}`).then((r: any) => r.json()),
    enabled: !!estadoId,
  })

  function handleCidadeCreated(_id: number, nome: string) {
    onChange(nome)
    queryClient.invalidateQueries({ queryKey: ["crm-cidades", estadoId] })
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
        {value && !cidades.some((cid: Cidade) => cid.nome === value) && (
          <option value={value}>{value}</option>
        )}
        {cidades.map((cid: any) => (
          <option key={cid.id} value={cid.nome}>{cid.nome}</option>
        ))}
      </select>
      {estadoId && <QuickCreateCidade estadoId={estadoId} onCreated={handleCidadeCreated} />}
    </div>
  )
}
