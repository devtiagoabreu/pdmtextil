import type { ChamadoStatus, ChamadoCategoria, ChamadoPrioridade } from "@/lib/db/schema/chamados"

export const CHAMADO_STATUS_LABELS: Record<ChamadoStatus, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO: "Aguardando",
  RESOLVIDO: "Resolvido",
  FECHADO: "Fechado",
  REABERTO: "Reaberto",
  CANCELADO: "Cancelado",
}

export const CHAMADO_CATEGORIA_LABELS: Record<ChamadoCategoria, string> = {
  INCIDENTE: "Incidente",
  SOLICITACAO: "Solicitação",
  MANUTENCAO_CORRETIVA: "Manutenção corretiva",
  MANUTENCAO_PREVENTIVA: "Manutenção preventiva",
  OUTRO: "Outro",
}

export const CHAMADO_PRIORIDADE_LABELS: Record<ChamadoPrioridade, string> = {
  URGENTE: "Urgente",
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
}

export const CHAMADO_STATUS_COLORS: Record<ChamadoStatus, string> = {
  ABERTO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  EM_ANDAMENTO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  AGUARDANDO: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  RESOLVIDO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  FECHADO: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  REABERTO: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CANCELADO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export const CHAMADO_PRIORIDADE_COLORS: Record<ChamadoPrioridade, string> = {
  URGENTE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ALTA: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  MEDIA: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  BAIXA: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
}

export const CHAMADO_CATEGORIA_COLORS: Record<ChamadoCategoria, string> = {
  INCIDENTE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  SOLICITACAO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  MANUTENCAO_CORRETIVA: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  MANUTENCAO_PREVENTIVA: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  OUTRO: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
}

export function chamadoStatusLabel(status: string | null | undefined): string {
  return (status && CHAMADO_STATUS_LABELS[status as ChamadoStatus]) || "—"
}

export function chamadoCategoriaLabel(categoria: string | null | undefined): string {
  return (categoria && CHAMADO_CATEGORIA_LABELS[categoria as ChamadoCategoria]) || "—"
}

export function chamadoPrioridadeLabel(prioridade: string | null | undefined): string {
  return (prioridade && CHAMADO_PRIORIDADE_LABELS[prioridade as ChamadoPrioridade]) || "—"
}