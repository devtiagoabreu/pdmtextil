export const PROCESSO_STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  APROVADO: "Aprovado",
  PADRONIZADO: "Padronizado",
  OBSOLETO: "Obsoleto",
}

export const ATIVIDADE_TIPO_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  AUTOMATICA: "Automática",
  DECISAO: "Decisão",
  ESPERA: "Espera",
}

export function statusLabel(status: string | null | undefined): string {
  return (status && PROCESSO_STATUS_LABELS[status]) || "—"
}

export function tipoAtividadeLabel(tipo: string | null | undefined): string {
  return (tipo && ATIVIDADE_TIPO_LABELS[tipo]) || "—"
}

export const STATUS_COLORS: Record<string, string> = {
  RASCUNHO: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  APROVADO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PADRONIZADO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  OBSOLETO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}