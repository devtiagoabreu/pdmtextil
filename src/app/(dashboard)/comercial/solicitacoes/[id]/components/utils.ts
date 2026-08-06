import { SEGMENTOS_LABELS, TECNOLOGIAS_LABELS } from "./constants"

export function renderSegmentos(segmentos: string[]) {
  if (!segmentos || !Array.isArray(segmentos)) return "—"
  return segmentos.map((s: string) => SEGMENTOS_LABELS[s] || s).join(", ")
}

export function renderTecnologias(tecnologias: string[]) {
  if (!tecnologias || !Array.isArray(tecnologias)) return "—"
  return tecnologias.map((t: string) => TECNOLOGIAS_LABELS[t] || t).join(", ")
}

export function renderListaLabels(values: string[], labels: Record<string, string>) {
  if (!values || !Array.isArray(values)) return "—"
  return values.map((v: string) => labels[v] || v).join(", ")
}
