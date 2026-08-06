import type { OrientacaoPdf } from "./types"

export function formatarData(data: string | null | undefined): string {
  if (!data) return "—"
  try {
    return new Date(data).toLocaleDateString("pt-BR")
  } catch {
    return data
  }
}

export function formatarPeso(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—"
  return `${Number(valor).toFixed(4)} kg`
}

export function formatarMetragem(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—"
  return `${Number(valor).toFixed(1)} m`
}

export const ORIENTACAO_LABEL: Record<OrientacaoPdf, string> = {
  portrait: "Retrato",
  landscape: "Paisagem",
}
