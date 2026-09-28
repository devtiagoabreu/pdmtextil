"use client"

import { useQuery } from "@tanstack/react-query"

export type ChamadoCategoriaItem = {
  id: number
  codigo: string
  nome: string
  cor: string
  ativo: boolean
  ordem: number
}

const CORES_BADGE: Record<string, string> = {
  red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  lime: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
}

export const CHAMADO_CATEGORIA_CORES_OPCOES = Object.keys(CORES_BADGE)

export function chamadoCategoriaBadgeClass(cor: string | null | undefined): string {
  return CORES_BADGE[(cor || "slate").toLowerCase()] || CORES_BADGE.slate
}

export function useChamadoCategorias(somenteAtivas = true) {
  const { data } = useQuery<ChamadoCategoriaItem[]>({
    queryKey: ["chamados-categorias", somenteAtivas],
    queryFn: async () => {
      const res = await fetch(
        `/api/chamados/categorias${somenteAtivas ? "?somenteAtivas=true" : ""}`
      )
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const categorias: ChamadoCategoriaItem[] = data ?? []
  const porCodigo = new Map<string, ChamadoCategoriaItem>(
    categorias.map((c) => [c.codigo, c] as const)
  )

  const label = (codigo: string | null | undefined): string => {
    if (!codigo) return "—"
    return porCodigo.get(codigo)?.nome || codigo
  }

  const badgeClass = (codigo: string | null | undefined): string => {
    if (!codigo) return CORES_BADGE.slate
    const item = porCodigo.get(codigo)
    return item ? chamadoCategoriaBadgeClass(item.cor) : CORES_BADGE.slate
  }

  return { categorias, porCodigo, label, badgeClass }
}
