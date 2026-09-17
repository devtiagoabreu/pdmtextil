import type { ChamadoPrioridade } from "@/lib/db/schema/chamados"

export type SlaConfig = {
  primeiraRespostaHoras: number
  resolucaoHoras: number
}

export const SLA_CONFIG: Record<ChamadoPrioridade, SlaConfig> = {
  URGENTE: { primeiraRespostaHoras: 4, resolucaoHoras: 24 },
  ALTA: { primeiraRespostaHoras: 8, resolucaoHoras: 48 },
  MEDIA: { primeiraRespostaHoras: 24, resolucaoHoras: 96 },
  BAIXA: { primeiraRespostaHoras: 72, resolucaoHoras: 168 },
}

export const HORA_INICIO = 8
export const HORA_FIM = 18

export function isDiaUtil(data: Date): boolean {
  const dia = data.getDay()
  return dia !== 0 && dia !== 6
}

export function proximoDiaUtilApos(data: Date): Date {
  const d = new Date(data)
  d.setDate(d.getDate() + 1)
  d.setHours(HORA_INICIO, 0, 0, 0)
  while (!isDiaUtil(d)) d.setDate(d.getDate() + 1)
  return d
}

export function addWorkingHours(base: Date, horas: number): Date {
  let atual = new Date(base)
  if (!isDiaUtil(atual)) {
    atual = proximoDiaUtilApos(atual)
  } else if (atual.getHours() < HORA_INICIO) {
    atual.setHours(HORA_INICIO, 0, 0, 0)
  } else if (atual.getHours() >= HORA_FIM) {
    atual = proximoDiaUtilApos(atual)
  }

  let restante = horas
  while (restante > 0) {
    const fim = new Date(atual)
    fim.setHours(HORA_FIM, 0, 0, 0)
    const disponiveis = (fim.getTime() - atual.getTime()) / 36e5
    if (restante <= disponiveis) {
      atual = new Date(atual.getTime() + restante * 36e5)
      restante = 0
    } else {
      atual = proximoDiaUtilApos(atual)
      restante -= disponiveis
    }
  }
  return atual
}

export function addCalendarHours(base: Date, horas: number): Date {
  return new Date(new Date(base).getTime() + horas * 36e5)
}

export function prazoPrimeiraResposta(prioridade: ChamadoPrioridade, base: Date = new Date()): Date {
  return addWorkingHours(base, SLA_CONFIG[prioridade].primeiraRespostaHoras)
}

export function prazoResolucao(prioridade: ChamadoPrioridade, base: Date = new Date()): Date {
  return addCalendarHours(base, SLA_CONFIG[prioridade].resolucaoHoras)
}

export function prazoEstourado(prazo: Date | null | undefined, agora: Date = new Date()): boolean {
  if (!prazo) return false
  return prazo.getTime() < agora.getTime()
}

export function calcularSLA(
  prioridade: ChamadoPrioridade,
  base: Date = new Date()
): { primeiraRespostaPrazo: Date; resolucaoPrazo: Date } {
  return {
    primeiraRespostaPrazo: prazoPrimeiraResposta(prioridade, base),
    resolucaoPrazo: prazoResolucao(prioridade, base),
  }
}